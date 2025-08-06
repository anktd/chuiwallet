import { Network } from '../types/electrum';
import { selectBestServer } from './electrumServer';
import { ElectrumRpcClient } from './electrumRpcClient';

export class ElectrumService {
  private network: Network = Network.Mainnet;
  private rpcClient: ElectrumRpcClient | undefined;

  public async init(network: Network) {
    this.network = network;
    await this.connect();
    return this;
  }

  private async connect() {
    console.log('connecting');
    const server = await selectBestServer(this.network);
    this.rpcClient = await new ElectrumRpcClient(server).connect();
  }
}

export const electrumService = new ElectrumService();
