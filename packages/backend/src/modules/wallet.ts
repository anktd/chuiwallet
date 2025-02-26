// src/modules/wallet.ts
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import type { BIP32Interface } from 'bip32';
import BIP32Factory from 'bip32';
import * as tinysecp256k1 from 'tiny-secp256k1';
import { initEccLib } from 'bitcoinjs-lib';
import encryption from '../utils/encryption.js';

// Initialize ECC library (required for p2tr)
initEccLib(tinysecp256k1);

// Wrap bip32 with tiny-secp256k1 support
const bip32 = BIP32Factory(tinysecp256k1);

export type AddressType = 'legacy' | 'segwit' | 'taproot';

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
  taproot?: boolean; // if true, then use taproot derivation (BIP86)
  addressType?: AddressType; // "legacy", "segwit" or "taproot"
}

export default class Wallet {
  private mnemonic: string | null = null;
  private seed: Buffer | null = null;
  private root: BIP32Interface;
  private account?: BIP32Interface;
  private taproot: boolean;
  private network: bitcoin.networks.Network;
  private encryptedMnemonic: string | null = null;
  private addresses: string[];
  private xpub: string;
  private coin: number;

  constructor({ password, mnemonic, xpriv, network = 'mainnet', taproot = false, addressType }: WalletOptions) {
    // Set network based on parameter
    this.network = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    // Use coin=1 for testnet, coin=0 for mainnet
    this.coin = this.network === bitcoin.networks.testnet ? 1 : 0;
    this.taproot = taproot;
    this.addresses = [];

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

      // Determine derivation based on addressType:
      // - "legacy" uses BIP44: m/44'/coin'/0'
      // - "segwit" uses BIP84: m/84'/coin'/0'
      // - "taproot" uses BIP86: m/86'/coin'/0'
      const type = addressType || (taproot ? 'taproot' : 'segwit');
      if (type === 'legacy') {
        this.account = this.root.deriveHardened(44).deriveHardened(this.coin).deriveHardened(0);
      } else if (type === 'taproot') {
        this.account = this.root.deriveHardened(86).deriveHardened(this.coin).deriveHardened(0);
      } else {
        // Default to segwit
        this.account = this.root.deriveHardened(84).deriveHardened(this.coin).deriveHardened(0);
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
   * Generates a new receiving address.
   * For HD wallets (created from a mnemonic/seed), this uses a standard derivation.
   * Note: If the wallet was restored solely from xpriv, HD derivation is available,
   * but you might want to restrict certain functionality.
   */
  public generateAddress(index: number = 0): string {
    let address: string | undefined;
    if (!this.account) {
      throw new Error('No account available for derivation');
    }
    if (this.taproot || this.getAddressType() === 'taproot') {
      // Use BIP86 derivation for taproot
      const node = this.account.derive(0).derive(index);
      // For P2TR, use bitcoin.payments.p2tr with the internal pubkey (drop first byte)
      const internalPubkey = Buffer.from(node.publicKey.slice(1));
      address = bitcoin.payments.p2tr({
        internalPubkey,
        network: this.network,
      }).address;
    } else if (this.getAddressType() === 'legacy') {
      // Use BIP44 derivation for legacy addresses
      const node = this.account.derive(0).derive(index);
      address = bitcoin.payments.p2pkh({
        pubkey: Buffer.from(node.publicKey),
        network: this.network,
      }).address;
    } else {
      // Default to segwit (BIP84) using p2wpkh
      const node = this.account.derive(0).derive(index);
      address = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(node.publicKey),
        network: this.network,
      }).address;
    }
    this.addresses[index] = address || '';
    return address || '';
  }

  private getAddressType(): 'legacy' | 'segwit' | 'taproot' {
    // If the wallet was created with the taproot flag set to true, return "taproot".
    if (this.taproot) return 'taproot';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((this as any).addressType) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this as any).addressType;
    }

    // Without explicit information, default to "segwit" (BIP84).
    return 'segwit';
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
  // public signTransaction(psbt: bitcoin.Psbt): string {
  //   if (!this.mnemonic && !this.seed) {
  //     throw new Error('Wallet restored from xpriv; signing may be limited.');
  //   }
  //   const coin = this.network === bitcoin.networks.testnet ? 1 : 0;
  //   const account = this.taproot ? this.root : this.root.deriveHardened(84).deriveHardened(coin).deriveHardened(0);
  //   const keyPair = account.derive(0).derive(0);
  //   const signer = { ...keyPair, publicKey: Buffer.from(keyPair.publicKey) };
  //   psbt.signAllInputs(signer as unknown as bitcoin.Signer);
  //   psbt.finalizeAllInputs();
  //   return psbt.extractTransaction().toHex();
  // }
  public signTransaction(psbt: bitcoin.Psbt): string {
    const account = this.account!;
    // Derive the key for input 0
    const keyPair = account.derive(0).derive(0);
    if (!keyPair.privateKey) {
      throw new Error('Derived key does not have a private key');
    }

    // Wrap the keyPair with a custom sign function that converts the signature into a Buffer.
    const signer = {
      ...keyPair,
      publicKey: Buffer.from(keyPair.publicKey),
      sign: (hash: Buffer) => {
        // Call the original sign function, then convert its Uint8Array output to a Buffer.
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
