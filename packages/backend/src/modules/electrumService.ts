import type { ElectrumHistory, ElectrumUtxo } from '../types/electrum';
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
    logger.log('connecting');
    const server = await selectBestServer(this.network);
    this.rpcClient = await new ElectrumRpcClient(server).connect();
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

  public async sendRequest(methodName: string, params: unknown[]) {
    return this.rpcClient?.sendRequest(methodName, params);
  }

  public async sendBatchRequest(methodName: string, params: unknown[][]) {
    return this.rpcClient?.sendBatchRequest(methodName, params);
  }
}

export const electrumService = new ElectrumService();
