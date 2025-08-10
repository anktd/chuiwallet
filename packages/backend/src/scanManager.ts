import type { AddressEntry, HistoryEntry, UtxoEntry } from './types/cache';
import browser from 'webextension-polyfill';
import { addressToScriptHash, addressToScriptPubKey, toBitcoinNetwork } from './utils/crypto';
import { accountManager } from './accountManager';
import { walletManager } from './walletManager';
import { preferenceManager } from './preferenceManager';
import { electrumService } from './modules/electrumService';

export enum CacheType {
  Address = 'address',
  History = 'history',
  Utxo = 'utxo',
}

export enum ChangeType {
  External = 'receive',
  Internal = 'change',
}

export interface ScanManagerConfig {
  externalGapLimit: number;
  internalGapLimit: number;
  staleBatchSize: number;
  electrumBatchSize: number;
  pruneThresholdDays: number;
}

export const defaultScanConfig: ScanManagerConfig = {
  externalGapLimit: 500,
  internalGapLimit: 20,
  staleBatchSize: 50,
  electrumBatchSize: 10,
  pruneThresholdDays: 7,
};

export default class ScanManager {
  private config: ScanManagerConfig;
  private addressCacheReceive = new Map<number, AddressEntry>();
  private addressCacheChange = new Map<number, AddressEntry>();
  private historyCacheReceive = new Map<number, HistoryEntry>();
  private historyCacheChange = new Map<number, HistoryEntry>();
  private utxoCacheReceive = new Map<number, UtxoEntry>();
  private utxoCacheChange = new Map<number, UtxoEntry>();
  private highestScannedReceive = -1;
  private highestScannedChange = -1;
  private highestUsedReceive = -1;
  private highestUsedChange = -1;
  // nextReceiveIndex = 0;
  // nextChangeIndex = 0;
  public isScanning = false;

  constructor(config: ScanManagerConfig = defaultScanConfig) {
    this.config = { ...config };
  }

  public async init() {
    await this.loadAddress();
    await this.loadHistory();
    await this.loadUtxo();
    this.setHighestScanned();
    this.setHighestUsed();
    console.log(`Highest Scanned (Receive|Change): ${this.highestScannedReceive} | ${this.highestScannedChange}`);
    console.log(`Highest Used (Receive|Change): ${this.highestUsedReceive} | ${this.highestUsedChange}`);
  }

  public async addHistory() {
    console.log('Setting history');
    const index = 2;
    this.historyCacheReceive.set(index, {
      lastChecked: Date.now(),
      txs: [['txid', 0]],
    });

    this.highestUsedReceive = index;
    await this.saveHistory();
    console.log(this.historyCacheReceive);
  }

  public async forwardScan(changeType: ChangeType = ChangeType.External) {
    const gapLimit = changeType === ChangeType.External ? this.config.externalGapLimit : this.config.internalGapLimit;
    const highestUsed = changeType === ChangeType.External ? this.highestUsedReceive : this.highestUsedChange;
    const highestScanned = changeType === ChangeType.External ? this.highestScannedReceive : this.highestScannedChange;
    const unusedDelta = Math.max(0, highestScanned - highestUsed);
    const windowToScan = gapLimit - unusedDelta;
    if (windowToScan <= 0) {
      console.log('No scanning needed as unused range still within gap limit');
      return;
    }

    this.isScanning = true;
    try {
      const startIndex = highestScanned + 1;
      const endIndex = startIndex + windowToScan - 1; // Todo: Handle extension when new history found during scan
      await this.derive(startIndex, endIndex, changeType);
      await this.scan(startIndex, endIndex, changeType);
      await this.saveAddress();
    } finally {
      this.isScanning = false;
    }
  }

  private async derive(startIndex: number, endIndex: number, changeType: ChangeType = ChangeType.External) {
    console.log(`Scanning from ${startIndex} to ${endIndex} (${endIndex - startIndex} Indexes)`);
    const addressCache = changeType === ChangeType.External ? this.addressCacheReceive : this.addressCacheChange;
    for (let index = startIndex; index <= endIndex; index++) {
      if (!addressCache.has(index)) {
        const nowTimestamp = Date.now();
        const address = walletManager.deriveAddress(changeType === ChangeType.External ? 0 : 1, index);
        const entry: AddressEntry = {
          address,
          firstSeen: nowTimestamp,
          lastChecked: 0,
          everUsed: false,
        };
        addressCache.set(index, entry);
        // console.log(`Derived address for ${index}: ${address}`);
      }
    }

    if (changeType === ChangeType.External) {
      this.highestScannedReceive = Math.max(this.highestScannedReceive, endIndex);
    } else {
      this.highestScannedChange = Math.max(this.highestScannedChange, endIndex);
    }
  }

  private async scan(startIndex: number, endIndex: number, changeType: ChangeType = ChangeType.External) {
    console.log(`Scanning history/UTXO from ${startIndex} to ${endIndex}`);
    const bitcoinNetwork = toBitcoinNetwork(preferenceManager.get().activeNetwork);
    const addressCache = changeType === ChangeType.External ? this.addressCacheReceive : this.addressCacheChange;
    const historyCache = changeType === ChangeType.External ? this.historyCacheReceive : this.historyCacheChange;
    const utxoCache = changeType === ChangeType.External ? this.utxoCacheReceive : this.utxoCacheChange; // Assume added
    const indices = [];
    for (let i = startIndex; i <= endIndex; i++) {
      indices.push(i);
    }

    // Batch in groups for concurrency (adjust based on Electrum limits)
    for (let i = 0; i < indices.length; i += this.config.electrumBatchSize) {
      // Bootstrap for batch scanning
      const batchTimestamp = Date.now();
      const batch = indices.slice(i, i + this.config.electrumBatchSize);
      const scriptHashesPromises = batch.map(async index => {
        const entry = addressCache.get(index);
        if (!entry) return undefined;
        const scriptHash = await addressToScriptHash(entry.address, bitcoinNetwork);
        return [scriptHash];
      });
      const scriptHashes: string[][] = (await Promise.all(scriptHashesPromises)).filter(
        (item): item is string[] => item !== undefined,
      );

      // Scan Histories
      const histories = await electrumService.getHistoryBatch(scriptHashes);
      for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
        const hdIndex = batch[batchIndex]; // map back from batch pos → HD index
        const entry = addressCache.get(hdIndex);
        if (!entry) continue;

        entry.lastChecked = batchTimestamp;

        const history = histories[batchIndex] ?? [];
        if (history.length > 0) {
          entry.everUsed = true;
          this.upsertHistoryIfUsed(historyCache, hdIndex, batchTimestamp, history);
          if (changeType === ChangeType.External) {
            this.highestUsedReceive = Math.max(this.highestUsedReceive, hdIndex);
          } else {
            this.highestUsedChange = Math.max(this.highestUsedChange, hdIndex);
          }
        }
      }
      await this.saveHistory();

      // Scan Utxo
      const utxosByIndex = await electrumService.getUtxoBatch(scriptHashes);
      for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
        const hdIndex = batch[batchIndex];
        const entry = addressCache.get(hdIndex);
        if (!entry) continue;

        const utxosRaw = utxosByIndex[batchIndex] ?? [];
        const scriptPubKey = addressToScriptPubKey(entry.address, bitcoinNetwork);
        const utxos = utxosRaw.map(utxo => ({
          txid: utxo.tx_hash,
          vout: utxo.tx_pos,
          value: utxo.value,
          height: utxo.height, // 0 means mempool
          address: entry.address,
          scriptPubKey,
        }));
        utxoCache.set(hdIndex, { lastChecked: batchTimestamp, utxos });

        if (utxos.length > 0) {
          entry.everUsed = true;
          if (changeType === ChangeType.External) {
            this.highestUsedReceive = Math.max(this.highestUsedReceive, hdIndex);
          } else {
            this.highestUsedChange = Math.max(this.highestUsedChange, hdIndex);
          }
        }
      }
      await this.saveUtxo();
    }
  }

  private upsertHistoryIfUsed(
    cache: Map<number, HistoryEntry>,
    hdIndex: number,
    ts: number,
    history: { tx_hash: string; height: number }[],
  ) {
    if (!history || history.length === 0) return; // ← no empty entries
    cache.set(hdIndex, {
      lastChecked: ts,
      txs: history.map(tx => [tx.tx_hash, tx.height] as [string, number]),
    });
  }

  private setHighestScanned() {
    this.highestScannedReceive = this.getHighestIndex(this.addressCacheReceive);
    this.highestScannedChange = this.getHighestIndex(this.addressCacheChange);
  }

  private setHighestUsed() {
    this.highestUsedReceive = this.getHighestIndex(this.historyCacheReceive);
    this.highestUsedChange = this.getHighestIndex(this.historyCacheChange);
  }

  private getHighestIndex(map: Map<number, unknown>): number {
    if (map.size === 0) return -1;
    let max = -Infinity;
    for (const k of map.keys()) {
      max = Math.max(max, k);
    }
    return max;
  }

  private getCacheKey(type: string = CacheType.Address, chain: string = ChangeType.External): string {
    const activeAccount = accountManager.getActiveAccount();
    return `${type}_${activeAccount.network}_${chain}_${activeAccount.index}`;
  }

  private async saveAddress() {
    const receiveKey = this.getCacheKey(CacheType.Address, ChangeType.External);
    const changeKey = this.getCacheKey(CacheType.Address, ChangeType.Internal);
    const receiveSerialised = Array.from(this.addressCacheReceive);
    const changeSerialised = Array.from(this.addressCacheChange);
    await browser.storage.local.set({ [receiveKey]: receiveSerialised });
    await browser.storage.local.set({ [changeKey]: changeSerialised });
  }

  private async loadAddress() {
    const receiveKey = this.getCacheKey(CacheType.Address, ChangeType.External);
    const changeKey = this.getCacheKey(CacheType.Address, ChangeType.Internal);
    const receiveAddresses = await browser.storage.local.get(receiveKey);
    const changeAddresses = await browser.storage.local.get(changeKey);
    if (Object.keys(receiveAddresses).length === 0 || Object.keys(changeAddresses).length === 0) {
      // Save empty address map to initialize data structure
      await this.saveAddress();
    } else {
      this.addressCacheReceive.clear();
      const storedReceive = receiveAddresses[receiveKey] as [number, AddressEntry][];
      for (const [index, entry] of storedReceive) {
        this.addressCacheReceive.set(index, entry);
      }
      const storedChange = changeAddresses[changeKey] as [number, AddressEntry][];
      for (const [index, entry] of storedChange) {
        this.addressCacheChange.set(index, entry);
      }
    }
  }

  private async saveHistory() {
    const receiveKey = this.getCacheKey(CacheType.History, ChangeType.External);
    const changeKey = this.getCacheKey(CacheType.History, ChangeType.Internal);
    const receiveSerialised = Array.from(this.historyCacheReceive);
    const changeSerialised = Array.from(this.historyCacheChange);
    await browser.storage.local.set({ [receiveKey]: receiveSerialised });
    await browser.storage.local.set({ [changeKey]: changeSerialised });
  }

  private async loadHistory() {
    const receiveKey = this.getCacheKey(CacheType.History, ChangeType.External);
    const changeKey = this.getCacheKey(CacheType.History, ChangeType.Internal);
    const receiveHistory = await browser.storage.local.get(receiveKey);
    const changeHistory = await browser.storage.local.get(changeKey);
    if (Object.keys(receiveHistory).length === 0 || Object.keys(changeHistory).length === 0) {
      // Save empty history map to initialize data structure
      await this.saveHistory();
    } else {
      this.historyCacheReceive.clear();
      const storedReceive = receiveHistory[receiveKey] as [number, HistoryEntry][];
      for (const [index, entry] of storedReceive) {
        this.historyCacheReceive.set(index, entry);
      }
      const storedChange = changeHistory[changeKey] as [number, HistoryEntry][];
      for (const [index, entry] of storedChange) {
        this.historyCacheChange.set(index, entry);
      }
    }
  }

  private async saveUtxo() {
    const receiveKey = this.getCacheKey(CacheType.Utxo, ChangeType.External);
    const changeKey = this.getCacheKey(CacheType.Utxo, ChangeType.Internal);
    const receiveSerialised = Array.from(this.utxoCacheReceive);
    const changeSerialised = Array.from(this.utxoCacheChange);
    await browser.storage.local.set({ [receiveKey]: receiveSerialised });
    await browser.storage.local.set({ [changeKey]: changeSerialised });
  }

  private async loadUtxo() {
    const receiveKey = this.getCacheKey(CacheType.Utxo, ChangeType.External);
    const changeKey = this.getCacheKey(CacheType.Utxo, ChangeType.Internal);
    const receiveUtxo = await browser.storage.local.get(receiveKey);
    const changeUtxo = await browser.storage.local.get(changeKey);
    if (Object.keys(receiveUtxo).length === 0 || Object.keys(changeUtxo).length === 0) {
      // Save empty utxo map to initialize data structure
      await this.saveUtxo();
    } else {
      this.utxoCacheReceive.clear();
      const storedReceive = receiveUtxo[receiveKey] as [number, UtxoEntry][];
      for (const [index, entry] of storedReceive) {
        this.utxoCacheReceive.set(index, entry);
      }
      const storedChange = changeUtxo[changeKey] as [number, UtxoEntry][];
      for (const [index, entry] of storedChange) {
        this.utxoCacheChange.set(index, entry);
      }
    }
  }
}

export const scanManager = new ScanManager();
