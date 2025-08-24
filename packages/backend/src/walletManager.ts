import browser from 'webextension-polyfill';
import type { CreateWalletOptions } from './modules/wallet';
import type { UtxoEntry } from './types/cache';
import { getCacheKey } from './utils/cache';
import { getBitcoinPrice } from './modules/blockonomics';
import { accountManager } from './accountManager';
import { wallet } from './modules/wallet';
import { preferenceManager } from './preferenceManager';
import { CacheType, ChangeType } from './types/cache';

/**
 * Manages the wallet lifecycle, including initialization, restoration, creation,
 * account management, and preferences synchronization.
 */
export class WalletManager {
  /**
   * Initializes the wallet manager by loading preferences and initializing the wallet.
   * @returns {Promise<void>} A promise that resolves when initialization is complete.
   */
  async init(): Promise<void> {
    await wallet.init();
  }

  /**
   * Aggregate confirmed/unconfirmed balance for the active account by summing UTXOs
   * from both external(0/receive) and internal(1/change) chains.
   */
  public async getBalance(): Promise<{
    confirmed: number;
    unconfirmed: number;
    confirmedUsd: number;
    unconfirmedUsd: number;
  }> {
    // 1) Resolve active account (index + network)
    const activeAccount = accountManager.getActiveAccount();
    console.log(activeAccount);
    if (!activeAccount) {
      return { confirmed: 0, unconfirmed: 0, confirmedUsd: 0, unconfirmedUsd: 0 };
    }

    const receiveKey = getCacheKey(CacheType.Utxo, ChangeType.External);
    const changeKey = getCacheKey(CacheType.Utxo, ChangeType.Internal);
    const payload = await browser.storage.local.get([receiveKey, changeKey]);

    const toPairs = (v: unknown): [number, UtxoEntry][] => (Array.isArray(v) ? (v as [number, UtxoEntry][]) : []);
    const receivePairs = toPairs(payload[receiveKey]);
    const changePairs = toPairs(payload[changeKey]);

    let confirmed = 0;
    let unconfirmed = 0;
    const addFrom = (pairs: [number, UtxoEntry][]) => {
      for (const [, entry] of pairs) {
        if (!entry?.utxos) continue;
        for (const u of entry.utxos) {
          if (u.height && u.height > 0) confirmed += u.value;
          else unconfirmed += u.value;
        }
      }
    };

    addFrom(receivePairs);
    addFrom(changePairs);

    // 5) Convert to USD (best effort)
    let confirmedUsd = 0;
    let unconfirmedUsd = 0;
    try {
      const rate = await getBitcoinPrice();
      console.log('BTC Price: ', rate);
      confirmedUsd = (confirmed / 1e8) * rate;
      unconfirmedUsd = (unconfirmed / 1e8) * rate;
    } catch {
      // ignore FX errors; return sats at minimum
      console.error('Error getting Bitcoin price');
    }

    return { confirmed, unconfirmed, confirmedUsd, unconfirmedUsd };
  }

  /**
   * Attempts to restore the wallet if possible using the provided session password.
   * @param {string} sessionPassword - The password from session storage.
   * @returns {Promise<boolean>} True if restoration was successful, false otherwise.
   */
  async restoreIfPossible(sessionPassword: string | null): Promise<boolean> {
    if (!wallet.isRestorable() || !sessionPassword) {
      return false;
    }

    await wallet.restore(preferenceManager.get().activeNetwork, sessionPassword);
    await this.ensureDefaultAccount();
    return true;
  }

  /**
   * Get the mnemonic of the current wallet
   * @param password
   */
  public getMnemonic(password: string) {
    return wallet.getMnemonic(password);
  }

  /**
   * Check if current wallet is restorable
   */
  public isRestorable(): boolean {
    return wallet.isRestorable();
  }

  /**
   * Derive new receiving address for the active account
   * @param chain
   * @param index
   */
  public deriveAddress(chain: number, index: number): string {
    const activeIndex = this.getActiveAccountListIndex();
    const activeAccount = accountManager.accounts[activeIndex];
    if (!activeAccount) {
      throw new Error('No active account available');
    }
    // Todo: (Optional) Check if wallet is restored/unlocked

    return wallet.deriveAddress(activeAccount, chain, index);
  }

  /**
   * Gets the index of the active account from preferences.
   * @returns {number} The active account index.
   */
  public getActiveAccountListIndex(): number {
    return preferenceManager.get().activeAccountIndex;
  }

  /**
   * Gets the highest account index
   */
  public getHighestAccountIndex(): number {
    const networkAccounts = accountManager.accounts.filter(a => a.network === preferenceManager.get().activeNetwork);
    if (networkAccounts.length === 0) {
      return -1;
    }
    return Math.max(...networkAccounts.map(a => a.index));
  }

  /**
   * Creates a new wallet with the provided mnemonic and password, and ensures a default account.
   * @param {string} mnemonic - The mnemonic phrase for the new wallet.
   * @param {string} password - The password to encrypt the vault.
   * @returns {Promise<void>} A promise that resolves when creation is complete.
   */
  public async createWallet(mnemonic: string, password: string): Promise<void> {
    await wallet.create({
      network: preferenceManager.get().activeNetwork,
      mnemonic,
      password,
    } as CreateWalletOptions);
    await this.ensureDefaultAccount(true); // Force creation for new wallets
  }

  /**
   * Derive and set the next account as active
   */
  public async deriveNextAccount() {
    const account = wallet.deriveAccount(this.getHighestAccountIndex() + 1);
    const activeAccountIndex = await accountManager.add(account);
    preferenceManager.get().activeAccountIndex = activeAccountIndex;
    await preferenceManager.update({ activeAccountIndex: activeAccountIndex });
  }

  /**
   * Ensures a default account (index 0) exists for the active network, deriving and adding it if necessary.
   * @param {boolean} [forceCreate=false] - If true, creates the account even if one exists.
   * @private
   */
  private async ensureDefaultAccount(forceCreate: boolean = false): Promise<void> {
    const hasDefaultAccount = accountManager.accounts.some(
      a => a.index === 0 && a.network === preferenceManager.get().activeNetwork,
    );

    if (forceCreate || !hasDefaultAccount) {
      const defaultAccount = wallet.deriveAccount(0);
      const activeAccountIndex = await accountManager.add(defaultAccount);
      preferenceManager.get().activeAccountIndex = activeAccountIndex;
      await preferenceManager.update({ activeAccountIndex: activeAccountIndex });
    }
  }
}

export const walletManager = new WalletManager();
