import browser from 'webextension-polyfill';
import type { CreateWalletOptions } from './modules/wallet';
import { wallet } from './modules/wallet';
import { type AddressEntry, CacheType, ChangeType, UtxoEntry } from './types/cache';
import { getCacheKey, selectByChain } from './utils/cache';
import { getBitcoinPrice } from './modules/blockonomics';
import { accountManager } from './accountManager';
import { preferenceManager } from './preferenceManager';
import { scanManager } from './scanManager';
import { add } from 'winston';

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
   * Get current receiving/change address
   * @param changeType
   */
  public getAddress(changeType: ChangeType = ChangeType.External) {
    const nextIndex = selectByChain(scanManager.nextReceiveIndex, scanManager.nextChangeIndex, changeType);
    return this.deriveAddress(changeType === ChangeType.External ? 0 : 1, nextIndex);
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
    const activeAccount = accountManager.getActiveAccount();
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

    let confirmedUsd = 0;
    let unconfirmedUsd = 0;
    try {
      const rate = await getBitcoinPrice();
      confirmedUsd = (confirmed / 1e8) * rate;
      unconfirmedUsd = (unconfirmed / 1e8) * rate;
    } catch {
      console.error('Error getting Bitcoin price');
    }

    return { confirmed, unconfirmed, confirmedUsd, unconfirmedUsd };
  }

  public async getTransactions(): Promise<
    Array<{
      txid: string;
      height: number;
      status: 'PENDING' | 'CONFIRMED';
      addresses: string[];
      chains: ChangeType[];
    }>
  > {
    // Keys that match ScanManager’s persistence format
    const receiveHistoryKey = getCacheKey(CacheType.History, ChangeType.External);
    const changeHistoryKey = getCacheKey(CacheType.History, ChangeType.Internal);
    const receiveAddrKey = getCacheKey(CacheType.Address, ChangeType.External);
    const changeAddrKey = getCacheKey(CacheType.Address, ChangeType.Internal);

    // Pull everything in one shot
    const payload = await browser.storage.local.get([
      receiveHistoryKey,
      changeHistoryKey,
      receiveAddrKey,
      changeAddrKey,
    ]);

    // Helpers to safely parse serialized Map<[index, Entry][]>
    const toPairs = <T>(v: unknown): [number, T][] => (Array.isArray(v) ? (v as [number, T][]) : []);

    type HistoryEntryLocal = { lastChecked: number; txs: [string, number][] };
    type AddressEntryLocal = { address: string; firstSeen: number; lastChecked: number; everUsed: boolean };

    const receiveHistoryPairs = toPairs<HistoryEntryLocal>(payload[receiveHistoryKey]);
    const changeHistoryPairs = toPairs<HistoryEntryLocal>(payload[changeHistoryKey]);
    const receiveAddrPairs = toPairs<AddressEntryLocal>(payload[receiveAddrKey]);
    const changeAddrPairs = toPairs<AddressEntryLocal>(payload[changeAddrKey]);

    // Build index->address maps for quick lookup
    const receiveIndexToAddress = new Map<number, string>(receiveAddrPairs.map(([i, e]) => [i, e.address]));
    const changeIndexToAddress = new Map<number, string>(changeAddrPairs.map(([i, e]) => [i, e.address]));

    // Aggregate unique transactions across both chains
    const txMap = new Map<
      string,
      {
        // key: txid
        txid: string;
        height: number; // take the (shared) height; default 0 if any pending
        status: 'PENDING' | 'CONFIRMED'; // derived from height
        addresses: Set<string>; // our addresses involved
        chains: Set<ChangeType>; // which chains saw it
      }
    >();

    const foldHistory = (pairs: [number, HistoryEntryLocal][], chain: ChangeType, idxToAddr: Map<number, string>) => {
      for (const [hdIndex, h] of pairs) {
        const addr = idxToAddr.get(hdIndex);
        if (!h?.txs || !addr) continue;

        for (const [txid, height] of h.txs) {
          let rec = txMap.get(txid);
          if (!rec) {
            rec = {
              txid,
              height: height || 0,
              status: (height || 0) > 0 ? 'CONFIRMED' : 'PENDING',
              addresses: new Set<string>(),
              chains: new Set<ChangeType>(),
            };
            txMap.set(txid, rec);
          } else {
            // If any copy is pending, keep pending; else keep max height
            if (rec.height === 0 || height === 0) {
              rec.height = 0;
              rec.status = 'PENDING';
            } else {
              rec.height = Math.max(rec.height, height);
              rec.status = 'CONFIRMED';
            }
          }
          rec.addresses.add(addr);
          rec.chains.add(chain);
        }
      }
    };

    foldHistory(receiveHistoryPairs, ChangeType.External, receiveIndexToAddress);
    foldHistory(changeHistoryPairs, ChangeType.Internal, changeIndexToAddress);

    // Materialize & sort: PENDING first, then by height desc
    const list = Array.from(txMap.values()).map(v => ({
      txid: v.txid,
      height: v.height,
      status: v.status,
      addresses: Array.from(v.addresses),
      chains: Array.from(v.chains),
    }));

    list.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'PENDING' ? -1 : 1;
      return (b.height || 0) - (a.height || 0);
    });

    return list;
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
