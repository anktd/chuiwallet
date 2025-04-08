import type { WalletOptions } from './modules/wallet.js';
import Wallet from './modules/wallet.js';

export default class WalletManager {
  private wallets: Wallet[];

  constructor() {
    this.wallets = [];
  }

  public createWallet(options: WalletOptions): Wallet {
    const wallet = new Wallet(options);
    this.wallets.push(wallet);
    return wallet;
  }

  public getWallet(index: number = 0): Wallet {
    return this.wallets[index];
  }

  public logout(): boolean {
    this.wallets = [];
    return true;
  }
}
