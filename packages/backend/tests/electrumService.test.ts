import electrumService from '../src/modules/electrumService';
import axios from 'axios';
import { ElectrumClient } from '@samouraiwallet/electrum-client';
import { addressToScripthash } from '../src/utils/converter';

// Mock axios and ElectrumClient
jest.mock('axios');
jest.mock('@samouraiwallet/electrum-client', () => ({
  ElectrumClient: {
    createClient: jest.fn().mockResolvedValue({
      blockchainScripthash_getBalance: jest.fn().mockResolvedValue({ confirmed: 1000, unconfirmed: 200 }),
      blockchainScripthash_getHistory: jest.fn().mockResolvedValue([{ tx_hash: 'tx1', height: 100 }]),
      blockchainTransaction_broadcast: jest.fn().mockResolvedValue('dummy_txid'),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

describe('ElectrumService Module', () => {
  beforeEach(async () => {
    await electrumService.connect();
  });

  afterEach(async () => {
    await electrumService.disconnect();
  });

  test('should fetch balance', async () => {
    // Use a dummy address; override converter to return a dummy scripthash.
    const testAddress = 'bc1qdummyaddressforsegwit';
    const spy = jest
      .spyOn(require('../src/utils/converter'), 'addressToScripthash')
      .mockReturnValue('dummy_scripthash');
    (axios.get as jest.Mock).mockResolvedValue({ data: { bitcoin: { usd: 30000 } } });
    const balance = await electrumService.fetchBalance(testAddress);
    expect(balance.balance).toEqual(1000 + 200);
    expect(balance.fiat).toEqual(((1000 + 200) / 1e8) * 30000);
    spy.mockRestore();
  });

  test('should fetch transaction history', async () => {
    const testAddress = 'bc1qdummyaddressforsegwit';
    const spy = jest
      .spyOn(require('../src/utils/converter'), 'addressToScripthash')
      .mockReturnValue('dummy_scripthash');
    const history = await electrumService.fetchTransactionHistory(testAddress);
    expect(history).toEqual([{ tx_hash: 'tx1', height: 100 }]);
    spy.mockRestore();
  });

  test('should broadcast transaction', async () => {
    const rawTx = 'dummy_raw_tx';
    const result = await electrumService.broadcastTransaction(rawTx);
    expect(result.success).toBe(true);
    expect(result.txid).toBe('dummy_txid');
  });
});
