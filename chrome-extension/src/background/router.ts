import type { Runtime } from 'webextension-polyfill';
import { walletManager } from '@extension/backend/src/walletManager';

type Handler = (params: unknown, sender: Runtime.MessageSender) => Promise<unknown> | unknown;

const handlers: Record<string, Handler> = {
  'wallet.isRestorable': () => {
    return walletManager.isRestorable();
  },
  createWallet: async params => {
    const { mnemonic, password } = params as { mnemonic: string; password: string };
    return await walletManager.createWallet(mnemonic as string, password as string);
  },
  getBalance: () => {},
  getHistory: () => {},
  getFeeEstimates: () => {},
  getCustomFeeEstimates: () => {},
  sendTransaction: () => {},
  signAndSendTransaction: () => {},
  logout: () => {},
  openXpub: () => {},
  ping: () => 'pong',
  echo: params => {
    const p = params as { msg?: unknown } | undefined;
    return { echoed: typeof p?.msg === 'string' ? p.msg : '' };
  },
};

export type RouterMessage = { action: string; params?: unknown };
export type RouterResponse =
  | { status: 'ok'; data: unknown }
  | { status: 'error'; error: { code: string; message: string } };

export async function handle(message: RouterMessage, sender: Runtime.MessageSender): Promise<RouterResponse> {
  try {
    const fn = handlers[message.action];
    if (!fn)
      return { status: 'error', error: { code: 'METHOD_NOT_FOUND', message: `Method not found: ${message.action}` } };
    const data = await fn(message.params, sender);
    return { status: 'ok', data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: 'error', error: { code: 'INTERNAL', message: msg } };
  }
}
