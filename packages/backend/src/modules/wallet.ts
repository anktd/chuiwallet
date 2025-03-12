// src/modules/wallet.ts
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import type { BIP32Interface } from 'bip32';
import BIP32Factory from 'bip32';
import * as secp256k1 from '@bitcoinerlab/secp256k1';
import { initEccLib } from 'bitcoinjs-lib';
import encryption from '../utils/encryption.js';
import { Buffer } from 'buffer';

// Initialize ECC library (required for p2tr)
initEccLib(secp256k1);

// Wrap bip32 with secp256k1 support
const bip32 = BIP32Factory(secp256k1);

export type AddressType = 'p2pkh' | 'p2sh' | 'bech32' | 'p2tr';

/**
 * WalletOptions lets you specify how to restore or create a wallet.
 * - If xpriv is provided, the wallet will be restored from the extended private key.
 * - If a mnemonic is provided (and valid), the wallet is restored from that mnemonic.
 * - Otherwise, a new mnemonic (and wallet) is generated.
 *
 * The network option determines whether the wallet is on "mainnet" or "testnet".
 */
export interface WalletOptions {
  password: string;
  mnemonic?: string;
  xpriv?: string;
  network?: 'mainnet' | 'testnet';
  addressType?: AddressType;
  accountIndex?: number;
}

export default class Wallet {
  private mnemonic: string | null = null;
  private seed: Buffer | null = null;
  private root: BIP32Interface;
  private account?: BIP32Interface;
  private network: bitcoin.networks.Network;
  private encryptedMnemonic: string | null = null;
  private xpub: string;
  private coin: number;
  private addressType: AddressType;
  private accountIndex: number;

  constructor({
    password,
    mnemonic,
    xpriv,
    network = 'mainnet',
    addressType = 'p2pkh',
    accountIndex = 0,
  }: WalletOptions) {
    // Set network based on parameter.
    this.network = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    // Use coin=1 for testnet, coin=0 for mainnet.
    this.coin = this.network === bitcoin.networks.testnet ? 1 : 0;
    this.addressType = addressType;
    this.accountIndex = accountIndex;

    if (xpriv) {
      // Restore from an extended private key (non-HD mnemonic restoration).
      this.root = bip32.fromBase58(xpriv, this.network);
      this.xpub = this.root.neutered().toBase58();
      // In this case, we do not have a mnemonic or seed.
    } else {
      // Restore from mnemonic if provided and valid; otherwise, generate a new mnemonic.
      if (mnemonic && bip39.validateMnemonic(mnemonic)) {
        this.mnemonic = mnemonic;
      } else {
        this.mnemonic = bip39.generateMnemonic();
      }
      this.seed = bip39.mnemonicToSeedSync(this.mnemonic);
      this.root = bip32.fromSeed(this.seed, this.network);

      // Choose derivation based on addressType:
      // p2pkh -> BIP44: m/44'/coin'/accountIndex'
      // p2sh   -> BIP49: m/49'/coin'/accountIndex'
      // bech32 -> BIP84: m/84'/coin'/accountIndex'
      // p2tr   -> BIP86: m/86'/coin'/accountIndex'
      if (this.addressType === 'p2pkh') {
        this.account = this.root.deriveHardened(44).deriveHardened(this.coin).deriveHardened(accountIndex);
      } else if (this.addressType === 'p2sh') {
        this.account = this.root.deriveHardened(49).deriveHardened(this.coin).deriveHardened(accountIndex);
      } else if (this.addressType === 'p2tr') {
        this.account = this.root.deriveHardened(86).deriveHardened(this.coin).deriveHardened(accountIndex);
      } else {
        this.account = this.root.deriveHardened(84).deriveHardened(this.coin).deriveHardened(accountIndex);
      }
      this.xpub = this.account.neutered().toBase58();
      this.encryptedMnemonic = encryption.encrypt(this.mnemonic, password);
    }
  }

  /**
   * Returns the extended public key for the wallet.
   */
  public getXpub(): string {
    return this.xpub;
  }

  /**
   * Returns the encrypted mnemonic.
   */
  public getEncryptedMnemonic(): string | null {
    return this.encryptedMnemonic;
  }

  /**
   * Recovers the mnemonic given the correct password.
   */
  public recoverMnemonic(password: string): string | null {
    if (!this.encryptedMnemonic) return null;
    return encryption.decrypt(this.encryptedMnemonic, password);
  }

  /**
   * Replaces the encrypted mnemonic (used when restoring a wallet).
   */
  public restoreEncryptedMnemonic(encrypted: string): void {
    this.encryptedMnemonic = encrypted;
  }

  /**
   * Sets the active account branch to the specified account index.
   */
  public setAccountIndex(index: number): void {
    if (this.addressType === 'p2pkh') {
      this.account = this.root.deriveHardened(44).deriveHardened(this.coin).deriveHardened(index);
    } else if (this.addressType === 'p2sh') {
      this.account = this.root.deriveHardened(49).deriveHardened(this.coin).deriveHardened(index);
    } else if (this.addressType === 'p2tr') {
      this.account = this.root.deriveHardened(86).deriveHardened(this.coin).deriveHardened(index);
    } else {
      this.account = this.root.deriveHardened(84).deriveHardened(this.coin).deriveHardened(index);
    }
    this.accountIndex = index;
  }

  public getAccountIndex(): number {
    return this.accountIndex;
  }

  /**
   * Returns the default receiving address (external index 0) for the current active account.
   */
  public getAddress(addressType: AddressType, accountIndex: number): string {
    let account: BIP32Interface;

    if (addressType === 'p2pkh') {
      account = this.root.deriveHardened(44).deriveHardened(this.coin).deriveHardened(accountIndex);
    } else if (this.addressType === 'p2sh') {
      account = this.root.deriveHardened(49).deriveHardened(this.coin).deriveHardened(accountIndex);
    } else if (this.addressType === 'p2tr') {
      account = this.root.deriveHardened(86).deriveHardened(this.coin).deriveHardened(accountIndex);
    } else {
      account = this.root.deriveHardened(84).deriveHardened(this.coin).deriveHardened(accountIndex);
    }

    let address: string | undefined;

    if (this.addressType === 'p2tr') {
      const node = account.derive(0).derive(0);
      const internalPubkey = Buffer.from(node.publicKey.slice(1));
      address = bitcoin.payments.p2tr({
        internalPubkey,
        network: this.network,
      }).address;
    } else if (this.addressType === 'p2pkh') {
      const node = account.derive(0).derive(0);
      address = bitcoin.payments.p2pkh({
        pubkey: Buffer.from(node.publicKey),
        network: this.network,
      }).address;
    } else if (this.addressType === 'p2sh') {
      const node = account.derive(0).derive(0);
      address = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({ pubkey: Buffer.from(node.publicKey), network: this.network }),
        network: this.network,
      }).address;
    } else {
      const node = account.derive(0).derive(0);
      address = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(node.publicKey),
        network: this.network,
      }).address;
    }

    return address || '';
  }

  /**
   * Generates a receiving address for the current active account using the external index.
   * Because the derivation is deterministic, if the wallet is recreated with the same parameters,
   * this method will always return the same address.
   */
  public generateAddress(): string {
    if (!this.account) {
      throw new Error('No account available for derivation');
    }

    let address: string | undefined;

    if (this.addressType === 'p2tr') {
      const node = this.account.derive(0).derive(0);
      const internalPubkey = Buffer.from(node.publicKey.slice(1));
      address = bitcoin.payments.p2tr({
        internalPubkey,
        network: this.network,
      }).address;
    } else if (this.addressType === 'p2pkh') {
      const node = this.account.derive(0).derive(0);
      address = bitcoin.payments.p2pkh({
        pubkey: Buffer.from(node.publicKey),
        network: this.network,
      }).address;
    } else if (this.addressType === 'p2sh') {
      const node = this.account.derive(0).derive(0);
      address = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({ pubkey: Buffer.from(node.publicKey), network: this.network }),
        network: this.network,
      }).address;
    } else {
      const node = this.account.derive(0).derive(0);
      address = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(node.publicKey),
        network: this.network,
      }).address;
    }

    return address || '';
  }

  /**
   * Adds a new account by setting the active account branch to a new index.
   * (Because an HD wallet is deterministic, "adding" an account just means using a new branch.)
   */
  public addAccount(newIndex?: number): void {
    const index = newIndex !== undefined ? newIndex : this.accountIndex + 1;
    this.setAccountIndex(index);
  }

  /**
   * Switches to the specified account index.
   */
  public switchAccount(accountIndex: number): void {
    this.setAccountIndex(accountIndex);
  }

  /**
   * Creates a PSBT for a transaction.
   */
  public createTransaction(params: {
    to: string;
    amount: number;
    feeRate: number;
    utxos: Array<{ txid: string; vout: number; scriptPubKey: string; value: number }>;
  }): bitcoin.Psbt {
    if (!this.mnemonic && !this.seed) {
      throw new Error('Wallet restored from xpriv; HD transaction creation may be limited.');
    }
    const psbt = new bitcoin.Psbt({ network: this.network });
    let inputSum = 0;
    for (const utxo of params.utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: Buffer.from(utxo.scriptPubKey, 'hex'),
          value: utxo.value,
        },
      });
      inputSum += utxo.value;
      if (inputSum >= params.amount + params.feeRate) break;
    }
    psbt.addOutput({ address: params.to, value: params.amount });
    const change = inputSum - params.amount - params.feeRate;
    if (change > 0) {
      const changeAddress = this.generateAddress();
      psbt.addOutput({ address: changeAddress, value: change });
    }
    return psbt;
  }

  /**
   * Signs a PSBT and returns the signed transaction hex.
   */
  public signTransaction(psbt: bitcoin.Psbt): string {
    if (!this.account) {
      throw new Error('No account available for signing');
    }
    const keyPair = this.account.derive(0).derive(0);
    if (!keyPair.privateKey) {
      throw new Error('Derived key does not have a private key');
    }
    const signer = {
      ...keyPair,
      publicKey: Buffer.from(keyPair.publicKey),
      sign: (hash: Buffer) => {
        const sig = keyPair.sign(hash);
        return Buffer.from(sig);
      },
    };
    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.signInput(i, signer as unknown as bitcoin.Signer);
    }
    psbt.finalizeAllInputs();
    return psbt.extractTransaction().toHex();
  }

  public static getDecryptedMnemonic(encryptedMnemonic: string, password: string): string | null {
    if (!encryptedMnemonic) return null;
    return encryption.decrypt(encryptedMnemonic, password);
  }
}
