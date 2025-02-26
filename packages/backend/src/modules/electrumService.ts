import axios from 'axios';
import config from 'config';
import { ElectrumClient } from '@samouraiwallet/electrum-client';
import type { CreateClientParams } from '@samouraiwallet/electrum-client/dist/types';
import { addressToScripthash } from '../utils/converter.js';
import { networks } from 'bitcoinjs-lib';

interface BalanceResponse {
  confirmed: number;
  unconfirmed: number;
}

interface HistoryItem {
  tx_hash: string;
  height: number;
}

class ElectrumService {
  private client: ElectrumClient | null = null;
  private options: CreateClientParams;

  constructor() {
    const versionFromConfig = config.get<string[]>('electrum.version') || ['1.2', '1.4'];
    if (versionFromConfig.length < 2) {
      throw new Error('electrum.version must have at least two elements');
    }

    const versionTuple: [string, string] = [versionFromConfig[0], versionFromConfig[1]];

    this.options = {
      host: config.get<string>('electrum.host') || 'btc.electroncash.dk',
      port: config.get<number>('electrum.port') || 60001,
      protocol: (config.get<string>('electrum.protocol') as 'tcp' | 'ssl') || 'tcp',
      electrumConfig: {
        client: 'chui-wallet',
        version: versionTuple,
      },
      persistencePolicy: { retryPeriod: config.get<number>('electrum.retryPeriod') || 2000 },
    };
  }

  public async connect(): Promise<void> {
    if (!this.client) {
      this.client = await ElectrumClient.createClient(this.options);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }

  public async fetchBalance(address: string, network = networks.bitcoin): Promise<{ balance: number; fiat: number }> {
    await this.connect();

    const scripthash = addressToScripthash(address, network);
    console.log('fetchBalance scripthash: ', scripthash);

    const balanceRes = (await this.client!.blockchainScripthash_getBalance(scripthash)) as BalanceResponse;

    const totalSats = balanceRes.confirmed + balanceRes.unconfirmed;
    const btc = totalSats / 1e8;

    let rate = 0;

    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'bitcoin',
          vs_currencies: 'usd',
        },
      });
      rate = response.data.bitcoin.usd;
    } catch (error) {
      console.error('Error fetching BTC price from CoinGecko, using fallback:', error);
    }

    const fiat = btc * rate;
    return { balance: totalSats, fiat };
  }

  public async fetchTransactionHistory(address: string, network = networks.bitcoin): Promise<HistoryItem[]> {
    await this.connect();

    const scripthash = addressToScripthash(address, network);
    console.log('fetchTransactionHistory scripthash: ', scripthash);

    const history = (await this.client!.blockchainAddress_getHistory(address)) as HistoryItem[];
    return history;
  }

  public async broadcastTransaction(rawTx: string): Promise<{ success: boolean; txid: string }> {
    await this.connect();
    const txid = (await this.client!.blockchainTransaction_broadcast(rawTx)) as string;
    return { success: true, txid };
  }
}

export default new ElectrumService();
