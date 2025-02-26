jest.mock('config', () => ({
  get: (key: string) => {
    switch (key) {
      case 'electrum.version':
        return ['1.2', '1.4'];
      case 'electrum.host':
        return 'electrum.blockstream.info';
      case 'electrum.port':
        return 50001;
      case 'electrum.protocol':
        return 'tcp';
      case 'electrum.retryPeriod':
        return 2000;
      case 'fee.apiUrl':
        return 'https://mempool.space/api/v1/fees/recommended';
      default:
        return undefined;
    }
  },
}));

import axios from 'axios';
import electrumService from '../src/modules/electrumService.js';

// Mock axios
jest.mock('axios');

// Also, manually mock the converter module so that we don’t depend on its implementation:
jest.mock('../src/utils/converter.js', () => ({
  addressToScripthash: jest.fn(() => 'dummy_scripthash'),
}));

describe('ElectrumService Module', () => {
  beforeEach(async () => {
    await electrumService.connect();
  });
  afterEach(async () => {
    await electrumService.disconnect();
  });

  test('should fetch balance', async () => {
    (axios.get as jest.Mock).mockResolvedValue({ data: { bitcoin: { usd: 30000 } } });
    const balance = await electrumService.fetchBalance('bc1qdummyaddress');
    expect(balance.balance).toEqual(1000 + 200);
    expect(balance.fiat).toEqual(((1000 + 200) / 1e8) * 30000);
  });

  test('should fetch transaction history', async () => {
    const history = await electrumService.fetchTransactionHistory('bc1qdummyaddress');
    expect(history).toEqual([{ tx_hash: 'tx1', height: 100 }]);
  });

  test('should broadcast transaction', async () => {
    const result = await electrumService.broadcastTransaction('dummy_raw_tx');
    expect(result.success).toBe(true);
    expect(result.txid).toBe('dummy_txid');
  });
});
