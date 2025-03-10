import { createHash } from 'crypto';
import * as bitcoin from 'bitcoinjs-lib';

type Callback = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (result: any) => void;
  reject: (error: Error) => void;
};

type ServerConfig = {
  host: string;
  port: number;
  useTls: boolean;
  network: 'mainnet' | 'testnet';
};

export type TransactionActivityStatus = 'PENDING' | 'CONFIRMED';
export type TransactionType = 'SEND' | 'RECEIVE';

export interface TransactionActivity {
  type: TransactionType;
  status: TransactionActivityStatus;
  amountBtc: number;
  amountUsd: number;
  feeBtc: number;
  feeUsd: number;
  timestamp: number;
  confirmations: number;
  transactionHash: string;
  sender: string;
  receiver: string;
}

export default class ElectrumService {
  private availableServerList: ServerConfig[] = [
    { host: 'bitcoinserver.nl', port: 50004, useTls: true, network: 'mainnet' },
    { host: 'electrum.petrkr.net', port: 50004, useTls: true, network: 'mainnet' },
    { host: 'bitcoin.dragon.zone', port: 50004, useTls: true, network: 'mainnet' },
    { host: 'btc.electroncash.dk', port: 60004, useTls: true, network: 'mainnet' },
    { host: 'electroncash.dk', port: 50004, useTls: true, network: 'mainnet' },
    { host: 'bch.imaginary.cash', port: 50004, useTls: true, network: 'mainnet' },
    { host: 'explorer.bch.ninja', port: 50004, useTls: true, network: 'mainnet' },
    { host: 'sv.usebsv.com', port: 50004, useTls: true, network: 'mainnet' },
    { host: 'electrum.peercoinexplorer.net', port: 50004, useTls: true, network: 'mainnet' },
    { host: 'blackie.c3-soft.com', port: 60004, useTls: true, network: 'testnet' },
  ];

  private serverList: ServerConfig[] = [];
  private currentServerIndex: number = 0;
  private host: string;
  private port: number;
  private useTls: boolean;
  private network: 'mainnet' | 'testnet';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private socket: any = null;
  private _requestId: number = 0;
  private _callbacks: Map<number, Callback> = new Map();

  constructor(network: 'mainnet' | 'testnet' = 'mainnet') {
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
    return new Promise((resolve, reject) => {
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
        reject(new Error('WebSocket connection error'));
      };
      this.socket.onclose = () => {
        console.warn(`WebSocket closed on ${wsUrl}`);
      };
    });
  }

  /**
   * Automatically try connecting to servers until one is reachable.
   */
  public async autoConnect(): Promise<void> {
    let connected = false;
    let attempts = 0;
    const maxAttempts = this.serverList.length;

    while (!connected && attempts < maxAttempts) {
      try {
        await this.connect();
        connected = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error(`Failed to connect to ${this.host}:${this.port}, error: ${err.message}`);
        await this.switchServer();
        attempts++;
      }
    }

    if (!connected) {
      throw new Error('Unable to connect to any Electrum WebSocket RPC server.');
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
   * Convert a legacy Bitcoin P2PKH address (Base58) to an Electrum script hash.
   */
  private async _addressToScriptHash(address: string): Promise<string> {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt(0);
    for (const char of address) {
      const index = ALPHABET.indexOf(char);
      if (index < 0) throw new Error('Invalid Bitcoin address');
      num = num * 58n + BigInt(index);
    }
    // Convert bigint to hex, padded to 25 bytes (50 hex characters)
    const hex = num.toString(16).padStart(50, '0');
    const fullPayload = Buffer.from(hex, 'hex');
    // Extract hash160 (skip version (1 byte) and checksum (4 bytes))
    const hash160 = fullPayload.slice(1, fullPayload.length - 4);
    // Construct P2PKH script: OP_DUP OP_HASH160 <hash160> OP_EQUALVERIFY OP_CHECKSIG
    const script = Buffer.concat([Buffer.from([0x76, 0xa9, 0x14]), hash160, Buffer.from([0x88, 0xac])]);
    const hash = await this.sha256(script);
    const reversedHash = Buffer.from(hash).reverse();
    return reversedHash.toString('hex');
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
    const response = await fetch('https://www.blockonomics.co/api/price?currency=USD');
    if (!response.ok) {
      throw new Error('Failed to fetch BTC to USD rate');
    }
    const data = await response.json();
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
  public async getHistory(address: string): Promise<any[]> {
    const scripthash = await this._addressToScriptHash(address);
    return this.tryRpcRequest('blockchain.scripthash.get_history', [scripthash]);
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
  public async getDetailedHistory(walletAddress: string): Promise<TransactionActivity[]> {
    const history = await this.getHistory(walletAddress);
    const rate = await this.getBtcToUsdRate();

    const activityPromises = history.map(async item => {
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
        console.log('rawTxResponse', rawTxResponse);
        let rawTxHex: string;
        if (typeof rawTxResponse === 'object' && rawTxResponse.hex) {
          rawTxHex = rawTxResponse.hex;
          timestamp = rawTxResponse.blocktime || 0;
          // Determine if any vin belongs to our wallet.
          const vinAddresses = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (rawTxResponse.vin || []).map((vin: any) => this.getSenderFromVin(vin)),
          );
          if (vinAddresses.includes(walletAddress)) {
            type = 'SEND';
          } else {
            type = 'RECEIVE';
          }
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

        // --- Fee Calculation for SEND ---
        let feeBtc = 0;
        if (type === 'SEND') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const inputValuesSats = await Promise.all((rawTxResponse.vin || []).map((vin: any) => this.getVinValue(vin)));
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
    });

    return Promise.all(activityPromises);
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
      // output.value is in BTC; convert to satoshis.
      return output.value;
    } catch (e) {
      console.error(e);
      return 0;
    }
  }

  /**
   * Helper to calculate the fee for a transaction (in BTC) by summing input values and subtracting outputs.
   * This is similar to what we do in getDetailedHistory, but can be called separately.
   */
  private async calculateFee(tx_hash: string): Promise<number> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawTxResponse: any = await this._sendRequest('blockchain.transaction.get', [tx_hash, true]);
      let rawTxHex: string;
      if (typeof rawTxResponse === 'object' && rawTxResponse.hex) {
        rawTxHex = rawTxResponse.hex;
      } else {
        rawTxHex = rawTxResponse;
      }
      const tx = bitcoin.Transaction.fromHex(rawTxHex);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inputValuesSats = await Promise.all((rawTxResponse.vin || []).map((vin: any) => this.getVinValue(vin)));
      const totalInputsSats = inputValuesSats.reduce((sum, val) => sum + val, 0);
      const totalOutputsSats = tx.outs.reduce((sum, out) => sum + out.value, 0);
      return (totalInputsSats - totalOutputsSats) / 1e8;
    } catch (e) {
      console.error(e);
      return 0;
    }
  }

  /**
   * Broadcast a raw transaction (hex string) to the Bitcoin network.
   * Returns the transaction ID (txid) if successful.
   */
  public async sendTransaction(rawTxHex: string): Promise<string> {
    return this.tryRpcRequest('blockchain.transaction.broadcast', [rawTxHex]);
  }

  /**
   * Close the connection.
   */
  public close(): void {
    if (!this.socket) return;
    if (typeof window === 'undefined') {
      this.socket.end();
    } else {
      this.socket.close();
    }
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
