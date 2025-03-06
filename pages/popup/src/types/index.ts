export type Currencies = 'btc' | 'bch' | 'usdt';

export const currencyMapping: Record<Currencies, string> = {
  btc: 'Bitcoin',
  bch: 'Bitcoin Cash',
  usdt: 'USDT',
};
