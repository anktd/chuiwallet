import type { Account } from './types/wallet';
import type { Network } from './types/electrum';
import browser from 'webextension-polyfill';

const ACCOUNTS_KEY = 'accounts';

/**
 * AccountManager manages the list of wallet accounts and the currently active one,
 * persisting directly to chrome.storage.local.
 */
export class AccountManager {
  public accounts: Account[] = [];
  public activeAccountIndex: number = -1;

  /**
   * Initialize by loading accounts and set active account index.
   */
  public async init(activeAccountIndex: number = -1): Promise<this> {
    await this.load();
    this.activeAccountIndex = activeAccountIndex;
    return this;
  }

  /**
   * Add a new account, persist and set it to active account; returns the new active account index.
   */
  public async add(account: Account): Promise<number> {
    this.accounts.push(account);
    await this.save();
    this.activeAccountIndex = this.accounts.length - 1;
    return this.activeAccountIndex;
  }

  /**
   * Remove an account by network+index, return the new activeAccountIndex if affected.
   */
  public async remove(account: { network: Network; index: number } | Account): Promise<number> {
    const activeAccount = this.accounts[this.activeAccountIndex];
    this.accounts = this.accounts.filter(a => !(a.network === account.network && a.index === account.index));
    this.activeAccountIndex = this.accounts.indexOf(activeAccount);
    await this.save();

    return this.activeAccountIndex;
  }

  /**
   * Get the currently active account
   */
  public getActiveAccount(): Account {
    if (this.activeAccountIndex < 0 || this.activeAccountIndex >= this.accounts.length) {
      throw new Error('No active account');
    }
    return this.accounts[this.activeAccountIndex];
  }

  /**
   * @private load all accounts from chrome.storage.local
   */
  private async load() {
    const payload = await new Promise<{ [key: string]: Account[] | undefined }>(resolve => {
      chrome.storage.local.get(ACCOUNTS_KEY, resolve);
    });
    this.accounts = payload[ACCOUNTS_KEY] ?? [];
  }

  /**
   * @private persist all accounts to chrome.storage.local
   */
  private async save() {
    await new Promise<void>(resolve => {
      chrome.storage.local.set({ [ACCOUNTS_KEY]: this.accounts }, () => resolve());
    });
  }

  public async destroy(): Promise<void> {
    this.accounts = [];
    this.activeAccountIndex = -1;
    await browser.storage.local.remove(ACCOUNTS_KEY);
  }
}

export const accountManager = new AccountManager();
