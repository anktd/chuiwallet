import WalletManager from './walletManager.js';
import electrumService from './modules/electrumService.js';
import feeEstimator from './modules/feeEstimator.js';
import settings from './modules/settings.js';
import walletConnect from './modules/walletConnect.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { bitcoin, testnet } from 'bitcoinjs-lib/src/networks.js';

// Export the public API
export { WalletManager, electrumService, feeEstimator, settings, walletConnect };

// Example usage/demo:
async function demo() {
  // Create a new Taproot wallet on mainnet.
  const walletManager = new WalletManager();
  const wallet = walletManager.createWallet({
    password: '12345678',
    taproot: true,
    network: 'mainnet',
  });
  const originalAddress = wallet.generateAddress(0);
  console.log('New Taproot wallet xpub:', wallet.getXpub());
  console.log('New Taproot receiving address:', originalAddress);

  // Recover the mnemonic from the created wallet.
  const recoveredMnemonic = wallet.recoverMnemonic('12345678');
  console.log('Recovered mnemonic:', recoveredMnemonic);

  // Now, restore a new wallet using the recovered mnemonic.
  const restoredWallet = walletManager.createWallet({
    password: '12345678',
    mnemonic: recoveredMnemonic!,
    taproot: true,
    network: 'mainnet',
  });
  const restoredAddress = restoredWallet.generateAddress(0);
  console.log('Restored receiving address:', restoredAddress);

  // Compare the original receiving address with the restored one.
  if (originalAddress === restoredAddress) {
    console.log('Success: The restored address matches the original address.');
  } else {
    console.error('Error: The restored address does not match the original address.');
  }

  const walletFromXpriv = walletManager.createWallet({
    password: '12345678',
    mnemonic: 'during brother medal minimum normal clever peasant three blade west outside quit',
    taproot: false,
    network: 'mainnet',
    addressType: 'legacy',
    // addressType: 'segwit',
  });
  const addressFromXpriv = walletFromXpriv.generateAddress(0);
  console.log('Wallet restored from xpriv, address:', addressFromXpriv);

  const balanceData = await electrumService.fetchBalance('1ADfuF9rGBNiQBjnN9uVmNPoxDzweRk4aN', bitcoin);
  console.log('Balance:', balanceData.balance, 'satoshis (Fiat:', balanceData.fiat, ')');

  const txHistory = await electrumService.fetchTransactionHistory('1ADfuF9rGBNiQBjnN9uVmNPoxDzweRk4aN', bitcoin);
  console.log('Transaction history:', txHistory);

  // // Create and sign a dummy transaction (using provided dummy UTXOs)
  // const dummyUtxos = [
  //   {
  //     txid: 'dummy_txid',
  //     vout: 0,
  //     scriptPubKey: '0014dummy', // replace with valid hex script
  //     value: 100000,
  //   },
  // ];
  // const psbt = wallet.createTransaction({
  //   to: 'destinationBitcoinAddress',
  //   amount: 50000,
  //   feeRate: 500, // sat/byte fee rate example
  //   utxos: dummyUtxos,
  // });
  // const signedTx = wallet.signTransaction(psbt);
  // console.log('Signed transaction hex:', signedTx);

  // // Broadcast the transaction via Electrum service
  // const broadcastResult = await electrumService.broadcastTransaction(signedTx);
  // console.log('Broadcast result:', broadcastResult);

  // // Fetch fee estimates
  // const feeEstimates = await feeEstimator.getFeeEstimates();
  // console.log('Fee estimates:', feeEstimates);

  // // Show settings and update if needed
  // console.log('Current settings:', settings.getSettings());
  // settings.updateSettings({ fiatCurrency: 'EUR', gapLimit: 1000 });
  // console.log('Updated settings:', settings.getSettings());

  // Wallet connect support: get xpub
  const xpub = walletConnect.getXpub(wallet);
  console.log('Wallet connect xpub:', xpub);

  // Disconnect Electrum client
  try {
    await electrumService.disconnect();
  } catch (err) {
    console.warn('Error during disconnect (likely expected):', err);
  }
}

if (require.main === module) {
  demo().catch(console.error);
}
