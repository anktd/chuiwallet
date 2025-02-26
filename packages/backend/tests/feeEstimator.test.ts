jest.mock('config', () => ({
  get: (key: string) => {
    if (key === 'fee.apiUrl') return 'https://mempool.space/api/v1/fees/recommended';
    if (key === 'electrum.host') return 'electrum.blockstream.info';
    if (key === 'electrum.port') return 50001;
    if (key === 'electrum.protocol') return 'tcp';
    if (key === 'electrum.version') return ['1.2', '1.4'];
    if (key === 'electrum.retryPeriod') return 2000;
    return undefined;
  },
}));
import feeEstimator from '../src/modules/feeEstimator.js';
import axios from 'axios';
jest.mock('axios');

describe('FeeEstimator Module', () => {
  test('should return fee estimates from API', async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: { fastestFee: 100, halfHourFee: 80, hourFee: 60 },
    });
    const fees = await feeEstimator.getFeeEstimates();
    expect(fees.fast.feeRate).toBe(100);
    expect(fees.medium.feeRate).toBe(80);
    expect(fees.slow.feeRate).toBe(60);
  });

  test('should use fallback fee estimates on error', async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error('API error'));
    const fees = await feeEstimator.getFeeEstimates();
    expect(fees.fast.feeRate).toBe(50);
    expect(fees.medium.feeRate).toBe(30);
    expect(fees.slow.feeRate).toBe(10);
  });
});
