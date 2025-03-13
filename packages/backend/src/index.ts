import WalletManager from './walletManager.js';
import electrumService from './modules/electrumService.js';
import feeEstimator from './modules/feeEstimator.js';
import settings from './modules/settings.js';
import walletConnect from './modules/walletConnect.js';
import * as sessionStorageHelper from './utils/sessionStorageHelper.js';

// Export the public API
export { WalletManager, electrumService, feeEstimator, settings, walletConnect, sessionStorageHelper };

// Example usage/demo:
async function demo() {}

if (require.main === module) {
  demo().catch(console.error);
}
