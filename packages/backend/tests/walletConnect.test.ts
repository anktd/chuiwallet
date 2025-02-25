import walletConnect from '../src/modules/walletConnect';
import Wallet from '../src/modules/wallet';

describe('WalletConnect Module', () => {
  test('should return xpub from wallet', () => {
    const wallet = new Wallet({ password: '12345678', taproot: false, network: 'mainnet' });
    const xpub = walletConnect.getXpub(wallet);
    expect(xpub).toBe(wallet.getXpub());
  });
});
