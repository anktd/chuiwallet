import type Wallet from './wallet.js';

class WalletConnect {
  public getXpub(wallet: Wallet): string {
    if (!wallet) {
      throw new Error('Wallet not provided');
    }
    return wallet.getXpub();
  }
}

export default new WalletConnect();
