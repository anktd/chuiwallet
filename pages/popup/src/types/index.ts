export type Currencies = 'btc' | 'bch' | 'usdt';
export type TransactionActivityStatus = 'PENDING' | 'CONFIRMED';
export type TransactionType = 'SEND' | 'RECEIVE';

export const currencyMapping: Record<Currencies, string> = {
  btc: 'Bitcoin',
  bch: 'Bitcoin Cash',
  usdt: 'USDT',
};

export interface Preferences {
  gapLimitReceive: number;
  gapLimitChange: number;
  locale: string;
  fiatCurrency: string;
  activeAccountIndex: number;
  activeNetwork: Network;
}

export interface BalanceData {
  confirmed: number;
  unconfirmed: number;
  confirmedUsd: number;
  unconfirmedUsd: number;
}

export interface TransactionActivity {
  type: TransactionType;
  status: TransactionActivityStatus;
  amountBtc: number;
  amountUsd: number;
  feeBtc: number;
  feeUsd: number;
  timestamp: number;
  confirmations: number;
  transactionHash: string;
  sender: string;
  receiver: string;
}
