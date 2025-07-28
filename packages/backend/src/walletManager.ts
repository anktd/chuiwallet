import { loadPreferences, updatePreferences } from './modules/preferences';
import { accountManager } from './accountManager';
import { wallet } from './modules/wallet';
import type { CreateWalletOptions } from './modules/wallet';
import type { Network } from './types/electrum';
import type { Preferences } from './modules/preferences';

/**
 * Manages the wallet lifecycle, including initialization, restoration, creation,
 * account management, and preferences synchronization.
 */
export class WalletManager {
  private preferences: Preferences;

  /**
   * Initializes the wallet manager by loading preferences and initializing the wallet.
   * @returns {Promise<void>} A promise that resolves when initialization is complete.
   */
  async init(): Promise<void> {
    this.preferences = await loadPreferences();
    await wallet.init();
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

    await wallet.restore(this.preferences.activeNetwork, sessionPassword);
    await this.ensureDefaultAccount();
    return true;
  }

  /**
   * Ensures a default account (index 0) exists for the active network, deriving and adding it if necessary.
   * @param {boolean} [forceCreate=false] - If true, creates the account even if one exists.
   * @private
   */
  private async ensureDefaultAccount(forceCreate: boolean = false): Promise<void> {
    const hasDefaultAccount = accountManager.accounts.some(
      a => a.index === 0 && a.network === this.preferences.activeNetwork,
    );

    if (forceCreate || !hasDefaultAccount) {
      const defaultAccount = wallet.deriveAccount(0);
      const activeAccountIndex = await accountManager.add(defaultAccount);
      this.preferences.activeAccountIndex = activeAccountIndex;
      await updatePreferences({ activeAccountIndex: activeAccountIndex });
    }
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
  getActiveAccountListIndex(): number {
    return this.preferences.activeAccountIndex;
  }

  /**
   * Gets the active network from preferences.
   * @returns {Network} The active network.
   */
  getActiveNetwork(): Network {
    return this.preferences.activeNetwork;
  }

  public getHighestAccountIndex(): number {
    const networkAccounts = accountManager.accounts.filter(a => a.network === this.preferences.activeNetwork);
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
  async createWallet(mnemonic: string, password: string): Promise<void> {
    await wallet.create({
      network: this.preferences.activeNetwork,
      mnemonic,
      password,
    } as CreateWalletOptions);
    await this.ensureDefaultAccount(true); // Force creation for new wallets
  }

  /**
   * Derive and set the next account as active
   */
  async deriveNextAccount() {
    const account = wallet.deriveAccount(this.getHighestAccountIndex() + 1);
    const activeAccountIndex = await accountManager.add(account);
    this.preferences.activeAccountIndex = activeAccountIndex;
    await updatePreferences({ activeAccountIndex: activeAccountIndex });
  }
}

export const walletManager = new WalletManager();
