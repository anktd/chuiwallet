import { accountManager } from './accountManager';
import { wallet } from './modules/wallet';
import type { CreateWalletOptions } from './modules/wallet';
import type { Network } from './types/electrum';
import { preferenceManager } from './preferenceManager';

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
   * Gets the active network from preferences.
   * @returns {Network} The active network.
   */
  public getActiveNetwork(): Network {
    return this.preferences.activeNetwork;
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
}

export const walletManager = new WalletManager();
