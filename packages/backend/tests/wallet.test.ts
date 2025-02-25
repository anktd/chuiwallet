import Wallet from '../src/modules/wallet';

describe('Wallet Module', () => {
  const password = '12345678';
  const mnemonic = 'spoon lawn correct fatal loyal chuckle rebuild series enroll deer casual expand';

  test('should create a new segwit wallet and recover mnemonic', () => {
    const wallet = new Wallet({ password, taproot: false, network: 'mainnet' });
    expect(wallet.getXpub()).toBeDefined();
    const recovered = wallet.recoverMnemonic(password);
    expect(recovered).toBeDefined();
    // We can't assert exact mnemonic for new wallet; just check it's a string with multiple words.
    expect(recovered?.split(' ').length).toBeGreaterThanOrEqual(12);
  });

  test('should generate a valid segwit receiving address', () => {
    const wallet = new Wallet({ password, taproot: false, network: 'mainnet' });
    const address = wallet.generateAddress(0);
    // Segwit addresses on mainnet typically start with "bc1q"
    expect(address).toMatch(/^bc1q/);
  });

  test('should generate a valid taproot receiving address', () => {
    const wallet = new Wallet({ password, taproot: true, network: 'mainnet' });
    const address = wallet.generateAddress(0);
    // Taproot addresses on mainnet start with "bc1p"
    expect(address).toMatch(/^bc1p/);
  });

  test('should restore wallet from mnemonic and match generated address', () => {
    const wallet1 = new Wallet({ password, mnemonic, taproot: false, network: 'mainnet' });
    const addr1 = wallet1.generateAddress(0);
    const wallet2 = new Wallet({ password, mnemonic, taproot: false, network: 'mainnet' });
    const addr2 = wallet2.generateAddress(0);
    expect(addr1).toEqual(addr2);
  });

  test('should create and sign a transaction', () => {
    const wallet = new Wallet({ password, taproot: false, network: 'mainnet' });
    // Dummy UTXO data (not real, just to test transaction creation/signing)
    const dummyUtxos = [
      {
        txid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        vout: 0,
        scriptPubKey: '0014' + '0'.repeat(40),
        value: 100000,
      },
    ];
    const psbt = wallet.createTransaction({
      to: 'bc1qzllv3x3v6huy7zz6s9kxw5kxklsdfjlsdfkjlsd', // dummy address
      amount: 50000,
      feeRate: 500,
      utxos: dummyUtxos,
    });
    const signedTx = wallet.signTransaction(psbt);
    expect(signedTx).toBeDefined();
    expect(typeof signedTx).toBe('string');
  });
});
