export interface FeeEstimate {
  feeRate: number; // in sat/byte
  estimatedTime: string;
}

export interface FeeEstimates {
  fast: FeeEstimate;
  medium: FeeEstimate;
  slow: FeeEstimate;
}
