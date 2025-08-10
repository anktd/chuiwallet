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
    address: string;
    scriptPubKey: string;
  }>;
}
