import type { ExtendedServerConfig, ServerConfig } from '../types/electrum';
import { logger } from '../utils/logger';

type RequestResolver = {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
};

/**
 * Client for making RPC calls to an Electrum server over WebSocket.
 * Handles connection, disconnection, and request/response management.
 */
export class ElectrumRpcClient {
  private server: ServerConfig | ExtendedServerConfig;
  private socket: WebSocket | null;
  private requests: Map<number, RequestResolver> = new Map();
  private runningRequestId: number = 0;

  /**
   * Constructs a new ElectrumRpcClient instance.
   * @param {ServerConfig | ExtendedServerConfig} server - The server configuration
   */
  constructor(server: ServerConfig | ExtendedServerConfig) {
    this.server = server;
    this.socket = null;
  }

  /**
   * Establishes a WebSocket connection to the Electrum server.
   * @returns {Promise<ElectrumRpcClient>} A promise that resolves with once connected.
   */
  public async connect(): Promise<ElectrumRpcClient> {
    return new Promise((resolve, reject) => {
      const protocol = this.server.useTls ? 'wss://' : 'ws://';
      const wsUrl = `${protocol}${this.server.host}:${this.server.port}`;
      this.disconnect();
      this.socket = new WebSocket(wsUrl);
      this.socket.onopen = () => {
        logger.log(`Connected to Electrum server at ${wsUrl}`);
        resolve(this);
      };
      this.socket.onmessage = (event: MessageEvent) => this.handleResponse(event.data);
      this.socket.onerror = (error: Event) => {
        const errorMessage = 'WebSocket error: ' + (error as ErrorEvent).message || 'Unknown error';
        logger.error(errorMessage, error);
        reject(new Error(errorMessage));
      };
      this.socket.onclose = () => {
        this.requests.forEach(request => request.reject(new Error('Websocket closed')));
        this.requests.clear();
        this.socket = null;
        logger.warn('WebSocket closed');
      };
    });
  }

  /**
   * Disconnects from the Electrum server by closing the WebSocket.
   * All pending requests will be rejected upon closure.
   */
  public disconnect() {
    if (!this.socket) return;
    this.socket.close();
    this.socket = null;
  }

  /**
   * Handles incoming WebSocket messages, parsing responses and resolve/reject corresponding requests.
   * @param {string} data - The raw message data from the WebSocket.
   * @throws {Error} If the message cannot be parsed.
   */
  private handleResponse(data: string): void {
    try {
      const message = JSON.parse(data);
      if (message.id !== undefined && this.requests.has(message.id)) {
        const { resolve, reject } = this.requests.get(message.id)!;
        this.requests.delete(message.id);
        if (message.error) {
          reject(new Error(message.error.message || 'Electrum error'));
        } else {
          resolve(message.result);
        }
      }
    } catch (error) {
      logger.error('Failed to parse message from Electrum', error, data);
    }
  }

  /**
   * Sends an RPC request to Electrum server.
   * @param {string} method - The Electrum RPC method name (e.g., 'server.version').
   * @param {unknown[]} [params=[]] - Optional parameters for the RPC call.
   * @returns {Promise<unknown>} A promise that resolves with the RPC result or rejects on error.
   */
  public sendRequest(method: string, params: unknown[] = []): Promise<unknown> {
    //Todo: Improve failover switch connection
    return new Promise((resolve, reject) => {
      const id = ++this.runningRequestId;
      const request = JSON.stringify({ jsonrpc: '2.0', id, method, params });
      this.requests.set(id, { resolve, reject });

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(request);
      } else {
        const errorMessage = 'WebSocket is not open';
        logger.error(errorMessage);
        reject(new Error(errorMessage));
      }
    });
  }
}
