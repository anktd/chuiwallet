import type { ElectrumHistory, ElectrumTransaction, ElectrumUtxo } from '../types/electrum';
import * as bitcoin from 'bitcoinjs-lib';
import { Network } from '../types/electrum';
import { selectBestServer } from './electrumServer';
import { ElectrumRpcClient } from './electrumRpcClient';
import { logger } from '../utils/logger';

export class ElectrumService {
  private network: Network = Network.Mainnet;
  private rpcClient: ElectrumRpcClient | undefined;

  public async init(network: Network) {
    this.network = network;
    await this.connect();
    return this;
  }

  private async connect() {
    logger.log('Connecting Electrum server');
    const server = await selectBestServer(this.network);
    this.rpcClient = await new ElectrumRpcClient(server).connect();
  }

  public async getRawTransaction(txid: string, verbose = false) {
    if (!this.rpcClient) throw new Error('Electrum not connected');
    const response = await this.rpcClient.sendRequest('blockchain.transaction.get', [txid, verbose]);

    if (!verbose && typeof response === 'string') return response;

    if (verbose && response && typeof response === 'object' && 'hex' in response) {
      return response as ElectrumTransaction;
    }

    throw new Error(`Unexpected response for transaction ${txid}`);
  }

  public async getHistoryBatch(scriptHashes: string[][]) {
    if (!this.rpcClient) throw new Error('Electrum not connected');
    return (await this.rpcClient.sendBatchRequest(
      'blockchain.scripthash.get_history',
      scriptHashes,
    )) as ElectrumHistory[];
  }

  public async getUtxoBatch(scriptHashes: string[][]): Promise<ElectrumUtxo[][]> {
    if (!this.rpcClient) throw new Error('Electrum not connected');
    return (await this.rpcClient.sendBatchRequest(
      'blockchain.scripthash.listunspent',
      scriptHashes,
    )) as ElectrumUtxo[][];
  }

  /**
   * Broadcast a raw transaction hex via Electrum and return its txid.
   * @throws if the server rejects the tx or returns an unexpected shape.
   */
  public async broadcastTx(rawTxHex: string): Promise<string> {
    if (!this.rpcClient) throw new Error('Electrum not connected');

    const hex = rawTxHex.trim().toLowerCase();
    if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) {
      throw new Error('Invalid transaction hex');
    }

    try {
      const response = await this.rpcClient.sendRequest('blockchain.transaction.broadcast', [hex]);
      console.log('broadcast response', response);
      if (typeof response === 'string' && /^[0-9a-f]{64}$/i.test(response)) {
        return response; // txid from server
      }

      throw new Error(`Unexpected broadcast result: ${String(response)}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Broadcast failed: ${msg}`);
    }
  }

  /**
   * Returns current chain tip height from the Electrum server.
   * Uses `blockchain.headers.subscribe` which immediately returns the latest header.
   */
  async getTipHeight(): Promise<number> {
    type Header = { height: number; hex?: string; header?: string };
    const header = (await this.rpcClient?.sendRequest('blockchain.headers.subscribe')) as Header | undefined;
    return typeof header?.height === 'number' ? header.height : 0;
  }

  public async sendRequest(methodName: string, params: unknown[]) {
    return this.rpcClient?.sendRequest(methodName, params);
  }

  public async sendBatchRequest(methodName: string, params: unknown[][]) {
    return this.rpcClient?.sendBatchRequest(methodName, params);
  }
}

export const electrumService = new ElectrumService();
