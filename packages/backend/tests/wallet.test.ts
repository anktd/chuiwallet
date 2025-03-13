import Wallet from '../src/modules/wallet.js';
import * as bitcoin from 'bitcoinjs-lib';

describe('Wallet Module', () => {
  const password = '12345678';

  test('should create and sign a transaction', () => {
    // Create a segwit wallet (BIP84) on mainnet
    const wallet = new Wallet({
      password,
      network: 'mainnet',
      addressType: 'p2pkh',
    });
    // Generate the receiving address from the wallet
    const address = wallet.generateAddress();
    // Derive the expected output script using bitcoinjs-lib's toOutputScript
    const outputScript = bitcoin.address.toOutputScript(address, bitcoin.networks.bitcoin);
    const scriptPubKeyHex = outputScript.toString('hex');

    // Create a dummy UTXO that "belongs" to the wallet by using the exact same output script.
    const dummyUtxos = [
      {
        txid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // dummy txid
        vout: 0,
        scriptPubKey: scriptPubKeyHex,
        value: 100000, // in satoshis
      },
    ];

    // Use a known valid destination address (example: Blockstream's)
    const destination = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
    const psbt = wallet.createTransaction({
      to: destination,
      amount: 50000,
      feeRate: 500, // example fee rate
      utxos: dummyUtxos,
    });
    const signedTx = wallet.signTransaction(psbt);
    expect(signedTx).toBeDefined();
    expect(typeof signedTx).toBe('string');
  });
});
