export type Currencies = 'btc' | 'bch' | 'usdt';

export const currencyMapping: Record<Currencies, string> = {
  btc: 'Bitcoin',
  bch: 'Bitcoin Cash',
  usdt: 'USDT',
};

export interface StoredAccount {
  encryptedMnemonic: string;
  xpub: string;
  network: 'mainnet' | 'testnet';
  accountIndex: number;
  totalAccounts: number;
  isRestored: boolean;
}
