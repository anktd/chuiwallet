import * as bitcoin from 'bitcoinjs-lib';
import Wallet from '../src/modules/wallet.js';

describe('Wallet Module', () => {
  const password = '12345678';
  const mnemonic = 'spoon lawn correct fatal loyal chuckle rebuild series enroll deer casual expand';

  test('should create a new segwit wallet and recover mnemonic', () => {
    const wallet = new Wallet({ password, taproot: false, network: 'mainnet' });
    expect(wallet.getXpub()).toBeDefined();
    const recovered = wallet.recoverMnemonic(password);
    expect(recovered).toBeDefined();
    expect(recovered?.split(' ').length).toBeGreaterThanOrEqual(12);
  });

  test('should generate a valid segwit receiving address', () => {
    const wallet = new Wallet({ password, taproot: false, network: 'mainnet' });
    const address = wallet.generateAddress(0);
    // Native segwit (BIP84) addresses start with "bc1q" on mainnet.
    expect(address).toMatch(/^bc1q/);
  });

  test('should generate a valid taproot receiving address', () => {
    const wallet = new Wallet({ password, taproot: true, network: 'mainnet' });
    const address = wallet.generateAddress(0);
    // Taproot addresses on mainnet start with "bc1p".
    expect(address).toMatch(/^bc1p/);
  });

  test('should restore wallet from mnemonic and match generated address', () => {
    const wallet1 = new Wallet({ password, mnemonic, taproot: false, network: 'mainnet', addressType: 'legacy' });
    const addr1 = wallet1.generateAddress(0);
    const wallet2 = new Wallet({ password, mnemonic, taproot: false, network: 'mainnet', addressType: 'legacy' });
    const addr2 = wallet2.generateAddress(0);
    expect(addr1).toEqual(addr2);
  });

  test('should create and sign a transaction', () => {
    const wallet = new Wallet({ password, taproot: false, network: 'mainnet', addressType: 'segwit' });
    // Generate a receiving address and its corresponding output script.
    const address = wallet.generateAddress(0);
    const payment = bitcoin.payments.p2wpkh({
      address,
      network: bitcoin.networks.bitcoin,
    });
    if (!payment.output) {
      throw new Error('Could not generate output script for address');
    }
    const scriptPubKeyHex = payment.output.toString('hex');
    // Create a dummy UTXO that belongs to the wallet.
    const dummyUtxos = [
      {
        txid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // dummy txid
        vout: 0,
        scriptPubKey: scriptPubKeyHex, // must match the wallet's output script
        value: 100000, // in satoshis
      },
    ];

    const destination = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'; // a known valid address
    const psbt = wallet.createTransaction({
      to: destination,
      amount: 50000,
      feeRate: 500, // sat/byte fee rate example
      utxos: dummyUtxos,
    });
    const signedTx = wallet.signTransaction(psbt);
    expect(signedTx).toBeDefined();
    expect(typeof signedTx).toBe('string');
  });
});
