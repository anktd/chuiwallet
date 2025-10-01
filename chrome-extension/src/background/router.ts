import type { Runtime } from 'webextension-polyfill';
import browser from 'webextension-polyfill';
import { preferenceManager } from '@extension/backend/src/preferenceManager';
import { walletManager } from '@extension/backend/src/walletManager';
import { accountManager } from '@extension/backend/src/accountManager';
import { historyService } from '../../../packages/backend/src/modules/txHistoryService';
import { getSessionPassword, setSessionPassword } from '@extension/backend/dist/utils/sessionStorageHelper';
type Handler = (params: unknown, sender: Runtime.MessageSender) => Promise<unknown> | unknown;

const handlers: Record<string, Handler> = {
  'wallet.exist': async () => {
    return walletManager.isRestorable();
  },
  'wallet.restore': async () => {
    const sessionPassword = await getSessionPassword();
    const isRestorable = await walletManager.restoreIfPossible(sessionPassword);
    if (isRestorable) {
      browser.alarms.create('forwardScan', { when: Date.now() + 100 });
    }
    return isRestorable;
  },
  'wallet.create': async params => {
    const { mnemonic, password } = params as { mnemonic: string; password: string };
    await walletManager.createWallet(mnemonic, password);
    await setSessionPassword(password);
  },
  'wallet.getMnemonic': async () => {
    const password = await getSessionPassword();
    if (!password) {
      throw new Error('Password is required');
    }
    return walletManager.getMnemonic(password);
  },
  'wallet.getBalance': async () => {
    return await walletManager.getBalance();
  },
  'wallet.getReceivingAddress': async () => {
    return walletManager.getAddress();
  },
  'preferences.get': async () => {
    return preferenceManager.get();
  },
  'accounts.get': async () => {
    return accountManager.accounts;
  },
  'transactions.get': async () => {
    return historyService.get();
  },
  'fee.estimates': async param => {
    return await walletManager.getFeeEstimates(param as string);
  },
  'payment.send': async param => {
    const { toAddress, amountInSats, feerate } = param as { toAddress: string; amountInSats: number; feerate: number };
    if (!toAddress || !amountInSats || !feerate) {
      throw new Error('Missing required parameter');
    }
    const txid = await walletManager.sendPayment(toAddress, amountInSats, feerate);
    console.log(txid);
    return txid;
  },
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
