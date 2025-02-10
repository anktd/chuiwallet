import feeEstimator from '../src/modules/feeEstimator';
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
