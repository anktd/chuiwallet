import type { ElectrumTransaction } from '../types/electrum';
import type { AddressEntry, TxEntry, TxStatus, TxType } from '../types/cache';
import { CacheType, ChangeType } from '../types/cache';
import browser from 'webextension-polyfill';
import { scanManager } from '../scanManager';
import { electrumService } from './electrumService';
import { getCacheKey } from '../utils/cache';
import { getBitcoinPrice } from './blockonomics';

export class TxHistoryService {
  private txHistoryCache = new Map<string, TxEntry>();
  private parentTxCache = new Map<string, ElectrumTransaction>();

  public async get(): Promise<TxEntry[]> {
    await this.loadTxHistory();
    const histories = [...scanManager['historyCacheReceive'].values(), ...scanManager['historyCacheChange'].values()];

    for (const entry of histories) {
      for (const [txid] of entry.txs) {
        if (!Array.from(this.txHistoryCache.values()).some(e => e.transactionHash === txid)) {
          const tx = (await electrumService.getRawTransaction(txid, true)) as ElectrumTransaction;
          const bitcoinPrice = await getBitcoinPrice();
          const newEntry = await this.buildTxEntry(
            tx,
            scanManager.addressCacheReceive,
            scanManager.addressCacheChange,
            bitcoinPrice,
          );
          this.txHistoryCache.set(txid, newEntry);
        }
      }
    }

    await this.saveTxHistory();
    return Array.from(this.txHistoryCache.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  private async buildTxEntry(
    tx: ElectrumTransaction,
    addressCacheReceive: Map<number, AddressEntry>,
    addressCacheChange: Map<number, AddressEntry>,
    btcUsdRate?: number,
  ): Promise<TxEntry> {
    const myAddresses = this.buildMyAddressSet(addressCacheReceive, addressCacheChange);
    const inputs = await this.resolveInputs(tx, myAddresses);
    const outputs = this.resolveOutputs(tx, myAddresses);

    const inputsTotalBtc = inputs.reduce((s, i) => s + i.valueBtc, 0);
    const outputsTotalBtc = outputs.reduce((s, o) => s + o.valueBtc, 0);
    const feeBtc = inputs.length > 0 ? Math.max(0, inputsTotalBtc - outputsTotalBtc) : 0;

    const type: TxType = this.detectType(inputs, outputs);

    let amountBtc = 0;
    if (type === 'RECEIVE') {
      amountBtc = outputs.filter(o => o.mine).reduce((s, o) => s + o.valueBtc, 0);
    } else {
      // SEND → amount sent to external (exclude change)
      amountBtc = outputs.filter(o => !o.mine).reduce((s, o) => s + o.valueBtc, 0);
    }

    const { sender, receiver } = this.pickSenderReceiver(type, inputs, outputs);

    const status: TxStatus = tx.confirmations && tx.confirmations > 0 ? 'CONFIRMED' : 'PENDING';
    const ts = tx.time ?? tx.blocktime ?? Date.now();

    const amountUsd = btcUsdRate ? amountBtc * btcUsdRate : 0;
    const feeUsd = btcUsdRate ? feeBtc * btcUsdRate : 0;

    return {
      type,
      status,
      amountBtc,
      amountUsd,
      feeBtc,
      feeUsd,
      timestamp: ts,
      confirmations: tx.confirmations ?? 0,
      transactionHash: tx.txid,
      sender,
      receiver,
    };
  }

  private buildMyAddressSet(
    addressCacheReceive: Map<number, AddressEntry>,
    addressCacheChange: Map<number, AddressEntry>,
  ): Set<string> {
    const s = new Set<string>();
    for (const [, e] of addressCacheReceive) s.add(e.address);
    for (const [, e] of addressCacheChange) s.add(e.address);
    return s;
  }

  private async resolveInputs(
    tx: ElectrumTransaction,
    myAddresses: Set<string>,
  ): Promise<Array<{ address: string; valueBtc: number; mine: boolean }>> {
    const results: Array<{ address: string; valueBtc: number; mine: boolean }> = [];
    for (const vin of tx.vin) {
      // coinbase txs have no txid/vout
      if (!vin.txid) continue;
      const parent = await this.getParentTx(vin.txid);
      const prev = parent.vout[vin.vout];
      const addr =
        // Electrum often puts single address at .scriptPubKey.address; sometimes at .addresses[0]
        prev?.scriptPubKey?.address ?? (prev?.scriptPubKey?.addresses && prev.scriptPubKey.addresses[0]) ?? '';
      const valueBtc = typeof prev?.value === 'number' ? prev.value : 0;
      const mine = addr !== '' && myAddresses.has(addr);
      results.push({ address: addr, valueBtc, mine });
    }
    return results;
  }

  private resolveOutputs(
    tx: ElectrumTransaction,
    myAddresses: Set<string>,
  ): Array<{ address: string; valueBtc: number; mine: boolean }> {
    const outs: Array<{ address: string; valueBtc: number; mine: boolean }> = [];
    for (const vout of tx.vout) {
      const address =
        vout.scriptPubKey?.address ?? (vout.scriptPubKey.addresses && vout.scriptPubKey.addresses[0]) ?? '';
      const valueBtc = vout.value;
      const mine = address !== '' && myAddresses.has(address);
      outs.push({ address, valueBtc, mine });
    }
    return outs;
  }

  private async getParentTx(txid: string): Promise<ElectrumTransaction> {
    const cached = this.parentTxCache.get(txid);
    if (cached) return cached;
    const tx = (await electrumService.getRawTransaction(txid, true)) as ElectrumTransaction;
    this.parentTxCache.set(txid, tx);
    return tx;
  }

  private detectType(inputs: Array<{ mine: boolean }>, outputs: Array<{ mine: boolean }>): TxType {
    const anyInMine = inputs.some(i => i.mine);
    const anyOutMine = outputs.some(o => o.mine);
    if (anyInMine && anyOutMine) return 'SEND'; // self/with change → still a send
    if (anyInMine) return 'SEND';
    if (anyOutMine) return 'RECEIVE';
    // Shouldn’t happen for a wallet-relevant tx, fallback:
    return 'RECEIVE';
  }

  private pickSenderReceiver(
    txType: TxType,
    inputs: Array<{ address: string; mine: boolean }>,
    outputs: Array<{ address: string; valueBtc: number; mine: boolean }>,
  ): { sender: string; receiver: string } {
    if (txType === 'SEND') {
      const sender = inputs.find(i => i.mine)?.address || '';
      const external = outputs.filter(o => !o.mine);
      const receiver = external.sort((a, b) => b.valueBtc - a.valueBtc)[0]?.address || '';
      return { sender, receiver };
    } else {
      const sender = inputs.find(i => !i.mine)?.address || ''; // first external input as sender
      const receiver = outputs.find(o => o.mine)?.address || ''; // first of mine
      return { sender, receiver };
    }
  }

  private async saveTxHistory() {
    const cacheKey = getCacheKey(CacheType.Tx, ChangeType.External);
    const txHistorySerialised = Array.from(this.txHistoryCache.entries());
    await browser.storage.local.set({ [cacheKey]: txHistorySerialised });
  }

  private async loadTxHistory() {
    const cacheKey = getCacheKey(CacheType.Tx, ChangeType.External);
    const txHistory = await browser.storage.local.get(cacheKey);
    if (Object.keys(txHistory).length === 0) {
      // Save empty history map to initialize data structure
      await this.saveTxHistory();
    } else {
      this.txHistoryCache.clear();
      const storedTxHistory = (txHistory[cacheKey] as [string, TxEntry][]) ?? [];
      for (const [txid, entry] of storedTxHistory) this.txHistoryCache.set(txid, entry);
    }
  }

  public async clearCache(): Promise<void> {
    try {
      await browser.storage.local.remove(getCacheKey(CacheType.Tx, ChangeType.External));
    } catch (e) {
      console.error(e);
    } finally {
      this.txHistoryCache.clear();
      this.parentTxCache.clear();
    }
  }
}

export const historyService = new TxHistoryService();
