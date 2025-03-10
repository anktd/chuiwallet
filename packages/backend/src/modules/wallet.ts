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
  private addresses: string[];
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
    // Set network based on parameter
    this.network = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    // Use coin=1 for testnet, coin=0 for mainnet
    this.coin = this.network === bitcoin.networks.testnet ? 1 : 0;
    // Default address type to 'bech32' if not provided
    this.addressType = addressType || 'bech32';
    this.addresses = [];
    this.accountIndex = accountIndex;

    if (xpriv) {
      // Restore from an extended private key (non-HD mnemonic restoration)
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

      // Choose derivation based on the address type:
      // p2pkh -> BIP44: m/44'/coin'/0'
      // p2sh   -> BIP49: m/49'/coin'/0'
      // bech32 -> BIP84: m/84'/coin'/0'
      // p2tr   -> BIP86: m/86'/coin'/0'
      if (this.addressType === 'p2pkh') {
        this.account = this.root.deriveHardened(44).deriveHardened(this.coin).deriveHardened(accountIndex);
      } else if (this.addressType === 'p2sh') {
        this.account = this.root.deriveHardened(49).deriveHardened(this.coin).deriveHardened(accountIndex);
      } else if (this.addressType === 'p2tr') {
        this.account = this.root.deriveHardened(86).deriveHardened(this.coin).deriveHardened(accountIndex);
      } else {
        // Default to bech32 (BIP84)
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

  public restoreEncryptedMnemonic(encrypted: string): void {
    this.encryptedMnemonic = encrypted;
  }

  public setAccountIndex(index: number): void {
    // Derive the account based on the address type
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

  /**
   * Generates a new receiving address.
   * For HD wallets (created from a mnemonic/seed), this uses a standard derivation.
   */
  public generateAddress(index: number = 0): string {
    let address: string | undefined;
    if (!this.account) {
      throw new Error('No account available for derivation');
    }
    // Derive the node at branch 0 (external addresses)
    const node = this.account.derive(0).derive(index);
    if (this.addressType === 'p2pkh') {
      address = bitcoin.payments.p2pkh({
        pubkey: Buffer.from(node.publicKey),
        network: this.network,
      }).address;
    } else if (this.addressType === 'p2sh') {
      // Wrapped SegWit: p2wpkh inside p2sh
      const p2wpkh = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(node.publicKey),
        network: this.network,
      });
      address = bitcoin.payments.p2sh({
        redeem: p2wpkh,
        network: this.network,
      }).address;
    } else if (this.addressType === 'p2tr') {
      // For P2TR (Taproot), use the internal public key (drop the first byte)
      const internalPubkey = Buffer.from(node.publicKey.slice(1));
      address = bitcoin.payments.p2tr({
        internalPubkey,
        network: this.network,
      }).address;
    } else {
      // Default to bech32 (native SegWit - p2wpkh)
      address = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(node.publicKey),
        network: this.network,
      }).address;
    }
    this.addresses[index] = address || '';
    return address || '';
  }

  /**
   * Creates a PSBT for a transaction.
   * This example assumes a standard coin selection.
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
      const changeAddress = this.generateAddress(this.addresses.length);
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
    // Derive the key for input 0 as an example.
    const keyPair = this.account.derive(0).derive(0);
    if (!keyPair.privateKey) {
      throw new Error('Derived key does not have a private key');
    }

    // Wrap the keyPair with a custom sign function that converts the signature into a Buffer.
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
}
