import axios from 'axios';
import electrumService from '../src/modules/electrumService.js';

// Mock axios
jest.mock('axios');

// Manually mock the converter module to return a dummy scripthash.
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
    // Mock axios GET call to return a BTC price.
    (axios.get as jest.Mock).mockResolvedValue({
      data: { bitcoin: { usd: 30000 } },
    });
    const balance = await electrumService.fetchBalance('bc1qdummyaddress');
    // Expected balance is confirmed + unconfirmed = 1000 + 200 = 1200 satoshis.
    expect(balance.balance).toEqual(1200);
    // Fiat value = (1200/1e8) * 30000.
    expect(balance.fiat).toEqual((1200 / 1e8) * 30000);
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
