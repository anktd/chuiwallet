import { createHash } from 'crypto';
import net from 'net';
import tls from 'tls';
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
};

export interface DetailedTransaction {
  status: 'pending' | 'received' | 'sent' | 'self';
  txHash: string;
  explorerUrl: string;
  btcAmount: number;
  usdAmount: number;
  sender: string;
  receiver: string;
  timestamp: number | null;
}

export class ElectrumService {
  private serverList: ServerConfig[] = [{ host: 'bitcoinserver.nl', port: 50004, useTls: true }];

  private currentServerIndex: number = 0;
  private host: string;
  private port: number;
  private useTls: boolean;
  // NodeJS.Socket or WebSocket (depending on the environment)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private socket: any = null;
  private _requestId: number = 0;
  private _callbacks: Map<number, Callback> = new Map();
  private _buffer: string = '';

  constructor() {
    // Initialize with the first server in the list.
    const initialServer = this.serverList[this.currentServerIndex];
    this.host = initialServer.host;
    this.port = initialServer.port;
    this.useTls = initialServer.useTls;
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
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    if (!response.ok) {
      throw new Error('Failed to fetch BTC to USD rate');
    }
    const data = await response.json();
    return data.bitcoin.usd;
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

  // Add this helper method to extract a receiver address from a vout entry.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getReceiverFromVout(voutEntry: any, walletAddress: string): string {
    // If verbose output provides addresses, try using them.
    if (voutEntry.scriptPubKey && Array.isArray(voutEntry.scriptPubKey.addresses)) {
      const nonWallet = voutEntry.scriptPubKey.addresses.find((addr: string) => addr !== walletAddress);
      if (nonWallet) return nonWallet;
    }
    // Fallback: attempt to decode the output script using bitcoinjs-lib.
    try {
      // If the scriptPubKey object has a 'hex' field, use it.
      if (voutEntry.scriptPubKey && voutEntry.scriptPubKey.hex) {
        const script = Buffer.from(voutEntry.scriptPubKey.hex, 'hex');
        const addr = bitcoin.address.fromOutputScript(script);
        if (addr !== walletAddress) return addr;
      }
    } catch (e) {
      console.error(e);
    }
    return 'unknown';
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
  public async getDetailedHistory(walletAddress: string): Promise<DetailedTransaction[]> {
    const history = await this.getHistory(walletAddress);
    const rate = await this.getBtcToUsdRate();

    const detailedPromises = history.map(async item => {
      const { tx_hash, height } = item;
      let status: 'pending' | 'received' | 'sent' | 'self' = 'pending';
      let btcAmount = 0;
      let sender = 'unknown';
      let receiver = 'unknown';
      let timestamp: number | null = null;

      if (height !== 0) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawTxResponse: any = await this.tryRpcRequest('blockchain.transaction.get', [tx_hash, true]);
          let rawTxHex: string;
          if (typeof rawTxResponse === 'object' && rawTxResponse.hex) {
            rawTxHex = rawTxResponse.hex;
            timestamp = rawTxResponse.blocktime || null;

            if (rawTxResponse.vin && Array.isArray(rawTxResponse.vin) && rawTxResponse.vin.length > 0) {
              sender = await this.getSenderFromVin(rawTxResponse.vin[0]);
            }

            if (rawTxResponse.vout && Array.isArray(rawTxResponse.vout)) {
              for (const output of rawTxResponse.vout) {
                const possibleReceiver = this.getReceiverFromVout(output, walletAddress);
                if (possibleReceiver !== 'unknown') {
                  receiver = possibleReceiver;
                  break;
                }
              }
            }
          } else {
            rawTxHex = rawTxResponse;
          }

          const tx = bitcoin.Transaction.fromHex(rawTxHex);
          let receivedSat = 0;
          for (const out of tx.outs) {
            try {
              const outAddress = bitcoin.address.fromOutputScript(out.script);
              if (outAddress === walletAddress) {
                receivedSat += out.value;
              }
            } catch (e) {
              console.error(e);
            }
          }
          if (receivedSat > 0) {
            status = 'received';
            btcAmount = receivedSat / 1e8;
          } else {
            status = 'sent';
            const sentSat = tx.outs.reduce((sum, out) => sum + out.value, 0);
            btcAmount = sentSat / 1e8;
          }
        } catch (e) {
          console.error(`Failed to decode transaction ${tx_hash}:`, e);
        }
      }

      return {
        status,
        txHash: tx_hash,
        explorerUrl: `https://blockstream.info/tx/${tx_hash}`,
        btcAmount,
        usdAmount: btcAmount * rate,
        sender,
        receiver,
        timestamp,
      } as DetailedTransaction;
    });

    return Promise.all(detailedPromises);
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
    console.log(`Switching to ${this.host}:${this.port}`);
    await this.connect();
  }
}
