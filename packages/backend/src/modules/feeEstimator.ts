import axios from 'axios';
import config from 'config';

interface FeeEstimate {
  feeRate: number; // in sat/byte
  estimatedTime: string;
}

interface FeeEstimates {
  fast: FeeEstimate;
  medium: FeeEstimate;
  slow: FeeEstimate;
}

class FeeEstimator {
  private apiUrl: string;

  constructor() {
    this.apiUrl = config.get<string>('fee.apiUrl') || 'https://mempool.space/api/v1/fees/recommended';
  }

  public async getFeeEstimates(): Promise<FeeEstimates> {
    try {
      const response = await axios.get(this.apiUrl);
      return {
        fast: { feeRate: response.data.fastestFee, estimatedTime: '10 minutes' },
        medium: { feeRate: response.data.halfHourFee, estimatedTime: '30 minutes' },
        slow: { feeRate: response.data.hourFee, estimatedTime: '60 minutes' },
      };
    } catch (error) {
      console.error('Error fetching fee estimates:', error);
      return {
        fast: { feeRate: 50, estimatedTime: '10 minutes' },
        medium: { feeRate: 30, estimatedTime: '30 minutes' },
        slow: { feeRate: 10, estimatedTime: '60 minutes' },
      };
    }
  }
}

export default new FeeEstimator();
