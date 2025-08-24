export interface AddressEntry {
  address: string;
  firstSeen: number;
  lastChecked: number;
  everUsed: boolean;
}

export interface HistoryEntry {
  lastChecked: number; // timestamp of last fetch
  txs: Array<[string /*txid*/, number /*height*/]>;
}

export interface UtxoEntry {
  lastChecked: number;
  utxos: Array<{
    txid: string;
    vout: number;
    value: number; // sats
    height: number;
  }>;
}

export enum CacheType {
  Address = 'address',
  History = 'history',
  Utxo = 'utxo',
}

export enum ChangeType {
  External = 'receive',
  Internal = 'change',
}
