import type { BIP32Interface } from 'bip32';
import BIP32Factory from 'bip32';
import encryption from '../utils/encryption.js';
import * as bip39 from 'bip39';
import * as secp256k1 from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import { Network } from '../types/electrum';
import type { Account, Vault, WalletMeta } from '../types/wallet';
import { ScriptType } from '../types/wallet';
import { AccountManager } from '../accountManager';

const bip32 = BIP32Factory(secp256k1);
const WALLET_KEY = 'wallet';

/**
 * CreateWalletOptions specify how to restore or create a wallet.
 * - If xpriv is provided, the wallet will be restored from the extended private key.
 * - If a mnemonic is provided (and valid), the wallet is restored from that mnemonic.
 * - Otherwise, a new mnemonic (and wallet) is generated.
 *
 * The network option determines whether the wallet is on "mainnet" or "testnet".
 */
export interface CreateWalletOptions {
  password: string;
  mnemonic?: string;
  xpriv?: string;
  network: Network;
}

/**
 * Manages an HD (Hierarchical Deterministic) Bitcoin wallet, including creation, restoration,
 * encryption, and persistent storage using Chrome's local storage.
 */
export class Wallet {
  private encryptedVault: string | null = null;
  private root: BIP32Interface;
  private seed: Buffer;
  private network: bitcoin.networks.Network;
  private xpub: string;

  /**
   * Initializes the wallet by loading any existing encrypted vault from storage.
   * @returns {Promise<void>} A promise that resolves when initialization is complete.
   */
  public async init(): Promise<void> {
    await this.load();
  }

  /**
   * Restores the wallet from an encrypted vault using the provided password.
   * @param {Network} network - The Bitcoin network to use (Testnet or Mainnet).
   * @param {string} password - The password to decrypt the vault.
   * @returns {Promise<void>} A promise that resolves when restoration is complete.
   * @throws {Error} If no vault exists, the vault is empty, or decryption fails.
   */
  public async restore(network: Network, password: string): Promise<void> {
    if (!this.encryptedVault) {
      throw new Error('Missing vault');
    }

    this.network = network === Network.Testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    const vault: Vault | null = this.decryptVault(password);
    if (!vault) {
      throw new Error('Vault is empty');
    }

    this.deriveRootAndXpub(vault.xpriv, vault.mnemonic);
  }

  /**
   * Creates a new HD wallet or restores from provided options, encrypts the vault, and saves it.
   * @param {CreateWalletOptions} options - Options for creating or restoring the wallet.
   * @returns {Promise<void>} A promise that resolves when creation is complete.
   * @throws {Error} If a wallet already exists, no valid key is provided, or the mnemonic is invalid.
   */
  public async create(options: CreateWalletOptions): Promise<void> {
    if (this.root) {
      throw new Error('Wallet already exist');
    }

    this.network = options.network === Network.Testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    const vault: Vault = {
      xpriv: options.xpriv || null,
      mnemonic: options.mnemonic || null,
    };

    this.deriveRootAndXpub(vault.xpriv, vault.mnemonic);
    this.encryptVault(vault, options.password);
    await this.save();
  }

  public deriveAccount(index: number): Account {
    if (!this.root) {
      throw new Error('Wallet is not ready');
    }

    return {
      name: `Account #${index + 1}`,
      index,
      network: this.network === bitcoin.networks.bitcoin ? Network.Mainnet : Network.Testnet,
      xpub: 'abc',
      scriptType: ScriptType.P2WPKH,
    };
  }

  /**
   * Checks if an encrypted vault is available for restoration.
   * @returns {boolean} True if a vault exists and can be restored, false otherwise.
   */
  public isRestorable(): boolean {
    return !!this.encryptedVault;
  }

  /**
   * Derives the root BIP32 node and xpub from either an xpriv or mnemonic.
   * @param {string | null} [xpriv] - The extended private key (if provided).
   * @param {string | null} [mnemonic] - The mnemonic phrase (if provided).
   * @private
   * @throws {Error} If no valid key is provided or the mnemonic is invalid.
   */
  private deriveRootAndXpub(xpriv?: string | null, mnemonic?: string | null): void {
    if (xpriv) {
      this.root = bip32.fromBase58(xpriv, this.network);
      //Todo: support network switch for xpriv
    } else if (mnemonic) {
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic');
      }
      this.seed = bip39.mnemonicToSeedSync(mnemonic);
      this.root = bip32.fromSeed(this.seed, this.network);
    } else {
      throw new Error('No valid key provided');
    }
    this.xpub = this.root.neutered().toBase58();
  }

  /**
   * Decrypts the encrypted vault using the provided password.
   * @param {string} password - The password to decrypt the vault.
   * @returns {Vault | null} The decrypted vault object, or null if no vault exists or decryption fails.
   * @private
   */
  private decryptVault(password: string): Vault | null {
    if (!this.encryptedVault) {
      return null;
    }

    try {
      return JSON.parse(encryption.decrypt(this.encryptedVault, password));
    } catch {
      throw new Error('Decryption error');
    }
  }

  /**
   * Encrypts the vault using the provided password.
   * @param {Vault} vault - The vault object to encrypt.
   * @param {string} password - The password for encryption.
   * @private
   */
  private encryptVault(vault: Vault, password) {
    this.encryptedVault = encryption.encrypt(JSON.stringify(vault), password);
  }

  /**
   * Loads the wallet's encrypted vault from Chrome's local storage.
   * @returns {Promise<void>} A promise that resolves when loading is complete.
   * @private
   */
  private async load() {
    const payload = await new Promise<{ [key: string]: WalletMeta | undefined }>(resolve => {
      chrome.storage.local.get(WALLET_KEY, resolve);
    });

    const wallet = payload[WALLET_KEY] ?? null;
    if (wallet) {
      this.encryptedVault = wallet.vault;
    }
  }

  /**
   * Saves the encrypted vault to Chrome's local storage.
   * @returns {Promise<void>} A promise that resolves when saving is complete.
   * @private
   */
  private async save() {
    await new Promise<void>(resolve => {
      const wallet: WalletMeta = {
        vault: this.encryptedVault,
      };

      chrome.storage.local.set(
        {
          [WALLET_KEY]: wallet,
        },
        () => resolve(),
      );
    });
  }
}

export const wallet = new Wallet();
