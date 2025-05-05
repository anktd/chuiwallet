import { createHash } from 'crypto';
import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import type Wallet from './wallet';
import type {
  ExtendedServerConfig,
  FeeOptionSetting,
  ServerConfig,
  TransactionActivity,
  TransactionActivityStatus,
  TransactionType,
} from '../types/electrum';
import { DefaultPort, Network } from '../types/electrum';

type Callback = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (result: any) => void;
  reject: (error: Error) => void;
};

// Example function to measure latency by sending a simple RPC call.
async function measureServerLatency(server: ExtendedServerConfig): Promise<number> {
  const protocol = server.useTls ? 'wss://' : 'ws://';
  const url = `${protocol}${server.host}:${server.port}`;
  return new Promise<number>(resolve => {
    const socket = new WebSocket(url);
    const start = performance.now();
    // Use a timeout to consider the server unresponsive if it takes too long.
    const timeout = setTimeout(() => {
      socket.close();
      resolve(Number.MAX_SAFE_INTEGER);
    }, 5000); // 5 seconds

    socket.onopen = () => {
      // Optionally send a lightweight RPC call like server.version here.
      socket.send(JSON.stringify({ id: 1, method: 'server.version', params: [] }));
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    socket.onmessage = (event: MessageEvent) => {
      clearTimeout(timeout);
      const end = performance.now();
      socket.close();
      resolve(end - start);
    };

    socket.onerror = () => {
      clearTimeout(timeout);
      socket.close();
      resolve(Number.MAX_SAFE_INTEGER);
    };
  });
}

// Function to scan all servers and update their latency.
async function scanServers(servers: ExtendedServerConfig[]): Promise<ExtendedServerConfig[]> {
  const scannedServers = await Promise.all(
    servers.map(async server => {
      const latency = await measureServerLatency(server);
      return { ...server, latency, healthy: latency < 5000 }; // healthy if latency is less than 5 seconds
    }),
  );
  return scannedServers;
}

// Function to select the best server from a list.
async function selectBestServer(servers: ExtendedServerConfig[]): Promise<ExtendedServerConfig> {
  const scanned = await scanServers(servers);
  // Filter out unhealthy servers.
  const healthyServers = scanned.filter(s => s.healthy);
  if (healthyServers.length === 0) {
    throw new Error('No healthy servers found');
  }
  // Sort by latency.
  healthyServers.sort((a, b) => a.latency! - b.latency!);
  return healthyServers[0];
}

export default class ElectrumService {
  private availableServerList: ServerConfig[] = [
    { host: 'bitcoinserver.nl', port: 50004, useTls: true, network: Network.Mainnet },
    { host: 'btc.electroncash.dk', port: 60004, useTls: true, network: Network.Mainnet },
    { host: 'node.xbt.eu', port: DefaultPort.TLS, useTls: true, network: Network.Mainnet },
    { host: 'us11.einfachmalnettsein.de', port: DefaultPort.TLS, useTls: true, network: Network.Mainnet },
    { host: 'b.1209k.com', port: DefaultPort.TLS, useTls: true, network: Network.Mainnet },
    { host: 'blackie.c3-soft.com', port: 60004, useTls: true, network: Network.Testnet },
    { host: 'testnet1.bauerj.eu', port: DefaultPort.TLS, useTls: true, network: Network.Testnet },
    { host: '14.3.140.101', port: DefaultPort.TLS, useTls: true, network: Network.Testnet },
    { host: 'testnet.hsmiths.com', port: 53012, useTls: true, network: Network.Testnet },
  ];
  private serverList: ServerConfig[] = [];
  private currentServerIndex: number = 0;
  private host: string;
  private port: number;
  private useTls: boolean;
  private network: Network;
  private currentServer: ExtendedServerConfig | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private socket: any = null;
  private _requestId: number = 0;
  private gapLimit: number = 500;
  private _callbacks: Map<number, Callback> = new Map();
  private cachedBtcToUsdRate: number | null = null;
  private lastRateFetch: number = 0;
  private RATE_CACHE_DURATION = 300000; // 5 minutes in milliseconds

  constructor(network: Network = Network.Mainnet) {
    this.serverList = this.availableServerList.filter(server => server.network === network);
    if (this.serverList.length === 0) {
      throw new Error(`No servers available for network ${network}`);
    }
    const initialServer = this.serverList[this.currentServerIndex];
    this.host = initialServer.host;
    this.port = initialServer.port;
    this.useTls = initialServer.useTls;
    this.network = network;
  }

  /**
   * Establish connection to the current Electrum RPC server.
   */
  public async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const protocol = this.useTls ? 'wss://' : 'ws://';
      const wsUrl = `${protocol}${this.host}:${this.port}`;
      console.log(`Connecting to Electrum WebSocket: ${wsUrl}`);

      this.socket = new WebSocket(wsUrl);
      this.socket.onopen = () => {
        console.log(`Connected to ${wsUrl}`);
        resolve();
      };
      this.socket.onmessage = (event: MessageEvent) => this.handleData(event.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.onerror = (error: any) => {
        console.error(`WebSocket error on ${wsUrl}:`, error);
        reject();
        // reject(new Error('WebSocket connection error'));
      };
      this.socket.onclose = () => {
        console.warn(`WebSocket closed on ${wsUrl}`);
      };
    });
  }

  /**
   * Automatically try connecting to servers until one is reachable.
   */
  public async autoSelectAndConnect(): Promise<void> {
    try {
      const bestServer = await selectBestServer(this.serverList);
      console.log(`Selected best server: ${bestServer.host}:${bestServer.port} (latency: ${bestServer.latency} ms)`);
      this.currentServer = bestServer;
      // Connect via your proxy URL if needed. If your proxy is configured to route
      // to the best server internally, then you just connect to your proxy.
      const protocol = bestServer.useTls ? 'wss://' : 'ws://';
      const wsUrl = `${protocol}${bestServer.host}:${bestServer.port}`;
      this.socket = new WebSocket(wsUrl);
      this.socket.onopen = () => {
        console.log(`Connected to Electrum server at ${wsUrl}`);
      };
      this.socket.onmessage = (event: MessageEvent) => this.handleData(event.data);
      this.socket.onerror = (error: Event) => console.error('WebSocket error:', error);
      this.socket.onclose = () => console.warn('WebSocket closed.');
    } catch (error) {
      console.error('Failed to select and connect to a server:', error);
      throw error;
    }
  }

  /**
   * Buffer incoming data and process complete lines (newline-delimited JSON).
   */
  private handleData(data: string): void {
    try {
      const message = JSON.parse(data);
      if (message.id !== undefined && this._callbacks.has(message.id)) {
        const { resolve, reject } = this._callbacks.get(message.id)!;
        this._callbacks.delete(message.id);
        if (message.error) {
          reject(new Error(message.error.message || 'Electrum error'));
        } else {
          resolve(message.result);
        }
      }
    } catch (e) {
      console.error('Failed to parse message from Electrum:', e, data);
    }
  }

  /**
   * Send a JSON-RPC request.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _sendRequest(method: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this._requestId;
      const request = JSON.stringify({ jsonrpc: '2.0', id, method, params });
      this._callbacks.set(id, { resolve, reject });

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(request);
      } else {
        reject(new Error('WebSocket is not open.'));
      }
    });
  }

  /**
   * Wrap an RPC request with automatic fallback.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async tryRpcRequest(method: string, params: any[] = [], retryCount: number = 0): Promise<any> {
    try {
      return await this._sendRequest(method, params);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (retryCount < this.serverList.length - 1) {
        console.error(`RPC error on ${this.host}:${this.port}, switching server... Error: ${err.message}`);
        await this.switchServer();
        return this.tryRpcRequest(method, params, retryCount + 1);
      } else {
        throw err;
      }
    }
  }

  /**
   * Compute SHA-256 hash.
   */
  private async sha256(data: Buffer): Promise<Buffer> {
    if (typeof window === 'undefined') {
      return createHash('sha256').update(data).digest();
    } else {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      return Buffer.from(new Uint8Array(hashBuffer));
    }
  }

  /**
   * Convert bitcoin address to an Electrum script hash.
   */
  private async _addressToScriptHash(address: string): Promise<string> {
    // Determine the bitcoinjs-lib network (bitcoin or testnet)
    const networkConfig = this.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
    // Convert the address to its corresponding output script.
    const outputScript = bitcoin.address.toOutputScript(address, networkConfig);
    // Compute SHA-256 hash of the output script.
    const hash = await this.sha256(outputScript);
    // Reverse the hash and return its hex string.
    const reversedHash = Buffer.from(hash).reverse();

    return reversedHash.toString('hex');
  }

  public setGapLimit(newLimit: number): void {
    this.gapLimit = newLimit;
  }

  /**
   * Retrieve balance for a Bitcoin address.
   * Returns an object with 'confirmed' and 'unconfirmed' balances (in satoshis).
   */
  public async getBalance(address: string): Promise<{ confirmed: number; unconfirmed: number }> {
    const scripthash = await this._addressToScriptHash(address);
    return this.tryRpcRequest('blockchain.scripthash.get_balance', [scripthash]);
  }

  /**
   * Fetch the current BTC to USD conversion rate using CoinGecko.
   */
  public async getBtcToUsdRate(): Promise<number> {
    const now = Date.now();
    if (this.cachedBtcToUsdRate !== null && now - this.lastRateFetch < this.RATE_CACHE_DURATION) {
      return this.cachedBtcToUsdRate;
    }
    const response = await fetch('https://www.blockonomics.co/api/price?currency=USD');
    if (!response.ok) {
      throw new Error('Failed to fetch BTC to USD rate');
    }
    const data = await response.json();
    this.cachedBtcToUsdRate = data.price;
    this.lastRateFetch = now;
    return data.price;
  }

  /**
   * Retrieve balance with USD conversion.
   */
  public async getBalanceWithUsd(address: string): Promise<{
    confirmed: number;
    unconfirmed: number;
    confirmedUsd: number;
    unconfirmedUsd: number;
  }> {
    const balance = await this.getBalance(address);
    const rate = await this.getBtcToUsdRate();
    // Convert satoshis to BTC
    const confirmedBtc = balance.confirmed / 1e8;
    const unconfirmedBtc = balance.unconfirmed / 1e8;
    return {
      confirmed: balance.confirmed,
      unconfirmed: balance.unconfirmed,
      confirmedUsd: confirmedBtc * rate,
      unconfirmedUsd: unconfirmedBtc * rate,
    };
  }

  /**
   * Retrieve transaction history for a Bitcoin address.
   * Returns an array of transaction objects.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getHistory(address: string, sinceTimestamp?: number): Promise<any[]> {
    const scripthash = await this._addressToScriptHash(address);
    let history = await this.tryRpcRequest('blockchain.scripthash.get_history', [scripthash]);

    // Gap Limit Optimisation: if there are more than 500 transactions,
    // sort confirmed transactions by height descending and keep only the most recent 500 items (including pending ones)
    if (history.length > this.gapLimit) {
      const confirmedTxs = history
        .filter((tx: { height: number }) => tx.height > 0)
        .sort((a: { height: number }, b: { height: number }) => b.height - a.height);
      const pendingTxs = history.filter((tx: { height: number }) => tx.height === 0);
      // Keep pending ones and as many confirmed as possible to not exceed 500 total items.
      const limitedConfirmed = confirmedTxs.slice(0, Math.max(0, 500 - pendingTxs.length));
      history = [...pendingTxs, ...limitedConfirmed];
    }

    // Incremental history: if sinceTimestamp is provided, return only transactions newer than that timestamp.
    // Note: Electrum's raw history items may include a blocktime (or you can set it later in getDetailedHistory)
    if (sinceTimestamp !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history = history.filter((tx: { blocktime: any }) => (tx.blocktime || 0) > sinceTimestamp);
    }
    return history;
  }

  // Add this helper method to fetch sender from a vin entry using its previous transaction.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getSenderFromVin(vinEntry: any): Promise<string> {
    // If the vin entry already has an 'addr' field, return it.
    if (vinEntry.addr) return vinEntry.addr;

    try {
      // Fetch the previous transaction in verbose mode.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prevTxResponse: any = await this.tryRpcRequest('blockchain.transaction.get', [vinEntry.txid, true]);
      let rawTxHex: string;
      if (typeof prevTxResponse === 'object' && prevTxResponse.hex) {
        rawTxHex = prevTxResponse.hex;
      } else {
        rawTxHex = prevTxResponse;
      }
      const prevTx = bitcoin.Transaction.fromHex(rawTxHex);
      const prevVout = prevTx.outs[vinEntry.vout];
      // Decode the output script to get the sender address.
      const addr = bitcoin.address.fromOutputScript(prevVout.script);
      return addr;
    } catch (e) {
      console.error(e);
      return 'unknown';
    }
  }

  /**
   * Retrieve detailed transaction history.
   *
   * For each transaction, this method returns:
   * - status: pending (if height==0), received, sent, or self (if both inputs and outputs are owned)
   * - a block explorer link (using Blockstream)
   * - BTC amount (in BTC) and its USD value
   * - sender and receiver (simplified; production apps should do more robust parsing)
   * - timestamp (if available; here left as null or a placeholder)
   */
  public async getDetailedHistory(walletAddress: string, sinceTimestamp?: number): Promise<TransactionActivity[]> {
    // Get the (possibly filtered) raw history.
    const history = await this.getHistory(walletAddress, sinceTimestamp);
    const rate = await this.getBtcToUsdRate();

    const activities = await Promise.all(
      history.map(async item => {
        const { tx_hash, height } = item;
        const status: TransactionActivityStatus = height === 0 ? 'PENDING' : 'CONFIRMED';
        let type: TransactionType = 'RECEIVE';
        let amountBtc = 0;
        let sender = 'unknown';
        let receiver = 'unknown';
        let timestamp = 0;

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawTxResponse: any = await this._sendRequest('blockchain.transaction.get', [tx_hash, true]);
          let rawTxHex: string;
          if (typeof rawTxResponse === 'object' && rawTxResponse.hex) {
            rawTxHex = rawTxResponse.hex;
            timestamp = rawTxResponse.blocktime || 0;
            const vinAddresses = await Promise.all(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (rawTxResponse.vin || []).map((vin: any) => this.getSenderFromVin(vin)),
            );
            type = vinAddresses.includes(walletAddress) ? 'SEND' : 'RECEIVE';
          } else {
            rawTxHex = rawTxResponse;
          }

          const tx = bitcoin.Transaction.fromHex(rawTxHex);

          if (type === 'RECEIVE') {
            let sumReceivedSat = 0;
            if (rawTxResponse.vout && Array.isArray(rawTxResponse.vout)) {
              for (const output of rawTxResponse.vout) {
                try {
                  const outAddress =
                    output.scriptPubKey && Array.isArray(output.scriptPubKey.addresses)
                      ? output.scriptPubKey.addresses[0]
                      : bitcoin.address.fromOutputScript(Buffer.from(output.scriptPubKey.hex, 'hex'));
                  if (outAddress === walletAddress) {
                    sumReceivedSat += Math.floor(output.value * 1e8);
                  } else if (receiver === 'unknown') {
                    receiver = outAddress;
                  }
                } catch (e) {
                  console.error(e);
                }
              }
              amountBtc = sumReceivedSat / 1e8;
              if (rawTxResponse.vin && Array.isArray(rawTxResponse.vin) && rawTxResponse.vin.length > 0) {
                sender = await this.getSenderFromVin(rawTxResponse.vin[0]);
              }
            }
          } else {
            let sumSentSat = 0;
            if (rawTxResponse.vout && Array.isArray(rawTxResponse.vout)) {
              for (const output of rawTxResponse.vout) {
                try {
                  const outAddress =
                    output.scriptPubKey && Array.isArray(output.scriptPubKey.addresses)
                      ? output.scriptPubKey.addresses[0]
                      : bitcoin.address.fromOutputScript(Buffer.from(output.scriptPubKey.hex, 'hex'));
                  if (outAddress !== walletAddress) {
                    sumSentSat += Math.floor(output.value * 1e8);
                    if (receiver === 'unknown') {
                      receiver = outAddress;
                    }
                  }
                } catch (e) {
                  console.error(e);
                }
              }
              amountBtc = sumSentSat / 1e8;
              sender = walletAddress;
            }
          }

          let feeBtc = 0;
          if (type === 'SEND') {
            const inputValuesSats = await Promise.all(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (rawTxResponse.vin || []).map((vin: any) => this.getVinValue(vin)),
            );
            const totalInputsSats = inputValuesSats.reduce((sum, val) => sum + val, 0);
            const totalOutputsSats = tx.outs.reduce((sum, out) => sum + out.value, 0);
            feeBtc = (totalInputsSats - totalOutputsSats) / 1e8;
          }

          return {
            type,
            status,
            amountBtc,
            amountUsd: amountBtc * rate,
            feeBtc,
            feeUsd: feeBtc * rate,
            timestamp,
            confirmations: status === 'CONFIRMED' && rawTxResponse.confirmations ? rawTxResponse.confirmations : 0,
            transactionHash: tx_hash,
            sender,
            receiver,
          } as TransactionActivity;
        } catch (e) {
          console.error(`Failed to decode transaction ${tx_hash}:`, e);
          return {
            type: 'SEND',
            status: 'PENDING',
            amountBtc: 0,
            amountUsd: 0,
            feeBtc: 0,
            feeUsd: 0,
            timestamp: 0,
            confirmations: 0,
            transactionHash: tx_hash,
            sender: 'unknown',
            receiver: 'unknown',
          } as TransactionActivity;
        }
      }),
    );

    return activities;
  }

  /**
   * Helper to compute the value (in satoshis) of a vin entry by fetching its previous transaction.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getVinValue(vinEntry: any): Promise<number> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prevTxResponse: any = await this._sendRequest('blockchain.transaction.get', [vinEntry.txid, true]);
      const rawTxHex: string =
        typeof prevTxResponse === 'object' && prevTxResponse.hex ? prevTxResponse.hex : prevTxResponse;
      const prevTx = bitcoin.Transaction.fromHex(rawTxHex);
      const output = prevTx.outs[vinEntry.vout];
      return output.value;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e);
      return 0;
    }
  }

  /**
   * Estimates the fee for sending a transaction from 'from' to 'to' address.
   * @param from - The sending address.
   * @param to - The receiving address.
   * @returns An array of fee options,
   */
  public async getFeeEstimates(from: string, to: string): Promise<FeeOptionSetting[]> {
    try {
      // Fetch fee rates from mempool.space API (sats per byte)
      const feeResponse = await axios.get('https://mempool.space/api/v1/fees/recommended');
      const { fastestFee, halfHourFee, hourFee } = feeResponse.data;

      // Estimate input and output sizes (in bytes) based on address type heuristics.
      const inputSize = this.estimateInputSize(from);
      const outputSize = this.estimateOutputSize(to);
      const overhead = 10; // bytes, for tx overhead
      const txSize = overhead + inputSize + outputSize;

      // Fetch the current BTC price in USD.
      const btcPrice = await this.getBtcToUsdRate();

      // Calculate fee amounts.
      const slowBtc = (hourFee * txSize) / 1e8;
      const mediumBtc = (halfHourFee * txSize) / 1e8;
      const fastBtc = (fastestFee * txSize) / 1e8;

      return [
        { speed: 'slow', sats: hourFee, btcAmount: slowBtc, usdAmount: slowBtc * btcPrice },
        { speed: 'medium', sats: halfHourFee, btcAmount: mediumBtc, usdAmount: mediumBtc * btcPrice },
        { speed: 'fast', sats: fastestFee, btcAmount: fastBtc, usdAmount: fastBtc * btcPrice },
      ];
    } catch (error) {
      console.error('Error fetching fee estimates:', error);

      return [
        { speed: 'slow', sats: 0, btcAmount: 0, usdAmount: 0 },
        { speed: 'medium', sats: 0, btcAmount: 0, usdAmount: 0 },
        { speed: 'fast', sats: 0, btcAmount: 0, usdAmount: 0 },
      ];
    }
  }

  public async getCustomFeeEstimates(from: string, to: string, customSats: number): Promise<FeeOptionSetting> {
    try {
      // Estimate input and output sizes (in bytes) based on address type heuristics.
      const inputSize = this.estimateInputSize(from);
      const outputSize = this.estimateOutputSize(to);
      const overhead = 10; // bytes, for tx overhead
      const txSize = overhead + inputSize + outputSize;

      // Fetch the current BTC price in USD.
      const btcPrice = await this.getBtcToUsdRate();

      // Calculate fee amounts.
      const btcAmount = (customSats * txSize) / 1e8;

      return { speed: 'custom', sats: customSats, btcAmount: btcAmount, usdAmount: btcAmount * btcPrice };
    } catch (error) {
      console.error('Error fetching fee estimates:', error);

      return { speed: 'custom', sats: customSats, btcAmount: 0, usdAmount: 0 };
    }
  }

  /**
   * Estimate input size (in bytes) based on the "from" address type.
   * These heuristics are based on typical transaction sizes:
   * - Legacy (P2PKH): ~148 bytes per input.
   * - P2SH: ~108 bytes.
   * - Segwit (P2WPKH): ~68 vbytes.
   * - Taproot (P2TR): ~57 vbytes.
   */
  private estimateInputSize(address: string): number {
    if (address.startsWith('1')) return 148;
    if (address.startsWith('3')) return 108;
    if (address.startsWith('bc1p')) return 57;
    if (address.startsWith('bc1q')) return 68;
    return 148;
  }

  /**
   * Estimate output size (in bytes) based on the "to" address type:
   * - Legacy (P2PKH): ~34 bytes.
   * - P2SH: ~32 bytes.
   * - Segwit (P2WPKH): ~31 vbytes.
   * - Taproot (P2TR): ~43 bytes.
   */
  private estimateOutputSize(address: string): number {
    if (address.startsWith('1')) return 34;
    if (address.startsWith('3')) return 32;
    if (address.startsWith('bc1p')) return 43;
    if (address.startsWith('bc1q')) return 31;
    return 34;
  }

  /**
   * Fetches UTXOs for a given address using the Electrum RPC WebSocket API,
   * and computes the scriptPubKey for that address.
   *
   * @param electrumClient - An instance of your Electrum client that provides RPC calls.
   * @param address - The Bitcoin address for which UTXOs are fetched.
   * @param network - The bitcoinjs-lib network (e.g. bitcoin.networks.bitcoin or bitcoin.networks.testnet).
   * @returns A promise resolving to an array of UTXO objects in the format:
   *   { txid: string; vout: number; scriptPubKey: string; value: number }
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getUtxos(address: string): Promise<any[]> {
    const scripthash = await this._addressToScriptHash(address);
    const utxosResponse = await this.tryRpcRequest('blockchain.scripthash.listunspent', [scripthash]);

    const outputScript = bitcoin.address
      .toOutputScript(address, this.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet)
      .toString('hex');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const utxos = utxosResponse.map((utxo: any) => ({
      txid: utxo.tx_hash,
      vout: utxo.tx_pos,
      scriptPubKey: outputScript,
      value: utxo.value,
    }));

    return utxos;
  }

  /**
   * Helper function to convert a rawTx value into a Buffer.
   * It accepts a string (hex), a Buffer, an ArrayBuffer, or an object with a 'data' property.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public parseRawTx(rawTx: any): Buffer {
    if (typeof rawTx === 'string') {
      return Buffer.from(rawTx, 'hex');
    }
    if (Buffer.isBuffer(rawTx)) {
      return rawTx;
    }
    if (rawTx instanceof ArrayBuffer) {
      return Buffer.from(new Uint8Array(rawTx));
    }
    if (rawTx && typeof rawTx === 'object') {
      if (typeof rawTx.hex === 'string') {
        return Buffer.from(rawTx.hex, 'hex');
      }
      if (Array.isArray(rawTx.data)) {
        return Buffer.from(rawTx.data);
      }
    }
    throw new TypeError(
      "Invalid rawTx type: must be a hex string, Buffer, ArrayBuffer, or object with a 'hex' or 'data' property.",
    );
  }

  /**
   * Creates a PSBT for a transaction.
   *
   * @param from - The sending address.
   * @param params - The transaction parameters:
   *   - to: Destination address.
   *   - amount: Amount to send (in satoshis).
   *   - feeRate: Fee rate in sat/byte.
   *   - utxos: Array of UTXOs, each must include:
   *         txid: string,
   *         vout: number,
   *         scriptPubKey: string,
   *         value: number,
   *         rawTx?: string  // Full raw transaction hex (required for non-segwit inputs)
   * @returns A bitcoin.Psbt object.
   */
  public async createTransaction(
    from: string,
    params: {
      to: string;
      amount: number;
      feeRate: number;
      utxos: Array<{ txid: string; vout: number; scriptPubKey: string; value: number; rawTx?: string }>;
    },
  ): Promise<bitcoin.Psbt> {
    const psbt = new bitcoin.Psbt({
      network: this.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet,
    });

    let inputSum = 0;

    // Loop through UTXOs and add inputs.
    for (const utxo of params.utxos) {
      // Determine if the UTXO is legacy based on its scriptPubKey prefix.
      if (typeof utxo.scriptPubKey === 'string' && utxo.scriptPubKey.startsWith('76a914')) {
        // Legacy (P2PKH) input – require the full raw transaction.
        if (!utxo.rawTx) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawTx: any = await this._sendRequest('blockchain.transaction.get', [utxo.txid, true]);
          utxo.rawTx = rawTx;
          if (!utxo.rawTx) {
            throw new Error(`Mssing rawTx for legacy UTXO ${utxo.txid}:${utxo.vout}`);
          }
        }

        const nonWitnessUtxo = this.parseRawTx(utxo.rawTx);

        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: nonWitnessUtxo,
        });
      } else {
        // Otherwise assume segwit input.
        const scriptBuffer =
          typeof utxo.scriptPubKey === 'string' ? Buffer.from(utxo.scriptPubKey, 'hex') : utxo.scriptPubKey;
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: scriptBuffer,
            value: utxo.value,
          },
        });
      }
      inputSum += utxo.value;
      if (inputSum >= params.amount + params.feeRate) break;
    }

    psbt.addOutput({ address: params.to, value: params.amount });

    const change = inputSum - params.amount - params.feeRate;
    if (change > 0) {
      // Send change back to the sender.
      psbt.addOutput({ address: from, value: change });
    }

    return psbt;
  }

  /**
   * Broadcast a raw transaction (hex string) to the Bitcoin network.
   * Returns the transaction ID (txid) if successful.
   */
  public async sendTransaction(rawTxHex: string): Promise<string> {
    return this.tryRpcRequest('blockchain.transaction.broadcast', [rawTxHex]);
  }

  /**
   * Signs and broadcasts a transaction using the provided wallet.
   *
   * @param wallet - The wallet object used to create and sign the transaction.
   * @param to - The destination Bitcoin address.
   * @param amount - The amount to send (in satoshis).
   * @param feeRate - The fee rate in satoshis per byte.
   * @returns A promise that resolves with the transaction ID (txid) if successful.
   */
  public async signAndSendTransaction(wallet: Wallet, to: string, amount: number, feeRate: number): Promise<string> {
    const fromAddress = wallet.generateAddress();

    const utxos = await this.getUtxos(fromAddress);

    const psbt = await this.createTransaction(fromAddress, { to, amount, feeRate, utxos });

    const signedTxHex = wallet.signTransaction(psbt);

    try {
      const txid: string = await this.sendTransaction(signedTxHex);
      console.log('Transaction broadcasted, txid:', txid);
      return txid;
    } finally {
      console.error('Failed to broadcast transaction');
    }
  }

  /**
   * Close the connection.
   */
  public close(): void {
    if (!this.socket) return;
    this.socket.close();
    this.socket = null;
  }

  /**
   * Switch to the next server in the list and re-establish connection.
   */
  private async switchServer(): Promise<void> {
    this.close();
    this.currentServerIndex = (this.currentServerIndex + 1) % this.serverList.length;
    const newServer = this.serverList[this.currentServerIndex];
    this.host = newServer.host;
    this.port = newServer.port;
    this.useTls = newServer.useTls;
    this.network = newServer.network;
    console.log(`Switching to ${this.host}:${this.port}`);
    await this.connect();
  }
}
