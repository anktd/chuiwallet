import type { ExtendedServerConfig, ServerConfig } from '../types/electrum';
import { logger } from '../utils/logger';

type RequestResolver = {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
};

type JsonRpcObject = {
  jsonrpc: string;
  id: number;
  method: string;
  params: unknown[];
};

/**
 * Client for making RPC calls to an Electrum server over WebSocket.
 * Handles connection, disconnection, and request/response management.
 * Todo: Improve failover switch connection
 */
export class ElectrumRpcClient {
  private server: ServerConfig | ExtendedServerConfig;
  private socket: WebSocket | null;
  private requests: Map<number, RequestResolver> = new Map();
  private jsonRpcVersion: string = '2.0';
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
        this.disconnect();
        const errorMessage = 'WebSocket error: ' + (error as ErrorEvent).message || 'Unknown error';
        logger.error(errorMessage, error);
        reject(new Error(errorMessage));
      };
      this.socket.onclose = () => {
        this.disconnect();
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
    this.requests.forEach(request => request.reject(new Error('Websocket closed')));
    this.requests.clear();
    this.socket.close();
    this.socket = null;
  }

  /**
   * Handles incoming WebSocket messages, parsing responses and resolve/reject corresponding request(s).
   * @param {string} data - The raw message data from the WebSocket.
   * @throws {Error} If the message cannot be parsed.
   */
  private handleResponse(data: string): void {
    try {
      const payload = JSON.parse(data);
      const messages = Array.isArray(payload) ? payload : [payload];
      messages.forEach(message => {
        if (message.id !== undefined && this.requests.has(message.id)) {
          const { resolve, reject } = this.requests.get(message.id)!;
          this.requests.delete(message.id);
          if (message.error) {
            reject(new Error(message.error.message || 'Electrum error'));
          } else {
            resolve(message.result);
          }
        }
      });
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
  public async sendRequest(method: string, params: unknown[] = []): Promise<unknown> {
    this.assertSocketConnection();
    return new Promise((resolve, reject) => {
      const id = ++this.runningRequestId;
      const request = JSON.stringify(this.rpcRequestObject(id, method, params));
      this.requests.set(id, { resolve, reject });
      this.socket?.send(request);
    });
  }

  /**
   * Sends a batch of RPC requests to the Electrum server using the same method but different parameters.
   * @param {string} method - The Electrum RPC method name (e.g., 'blockchain.scripthash.get_balance').
   * @param {unknown[][]} paramSets - An array of parameter sets for the batch calls.
   * @returns {Promise<unknown[]>} A promise that resolves with an array of results in the order of the input paramSets.
   */
  public async sendBatchRequest(method: string, paramSets: unknown[][] = []): Promise<unknown[]> {
    this.assertSocketConnection();
    const batchRequests = paramSets.map(params => {
      const id = ++this.runningRequestId;
      return this.rpcRequestObject(id, method, params);
    });

    const requestResolvers = batchRequests.map(
      ({ id }) =>
        new Promise<unknown>((resolve, reject) => {
          this.requests.set(id, { resolve, reject });
        }),
    );

    const requestJson = JSON.stringify(batchRequests);
    this.socket?.send(requestJson);
    return Promise.all(requestResolvers);
  }

  private rpcRequestObject(id: number, method: string, params: unknown[]): JsonRpcObject {
    return { jsonrpc: this.jsonRpcVersion, id, method, params };
  }

  private assertSocketConnection() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      const errorMessage =
        'WebSocket is not open - connection state: ' + (this.socket ? this.socket.readyState : 'null');
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
