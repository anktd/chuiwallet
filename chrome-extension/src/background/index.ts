import 'webextension-polyfill';
import { walletThemeStorage } from '@extension/storage';
import { ElectrumService } from '@extension/backend/src/modules/electrumService';

walletThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

const electrumService = new ElectrumService();

electrumService.connect().catch(err => {
  console.error('Failed to connect to Electrum server:', err);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === 'getBalance') {
        const balance = await electrumService.getBalanceWithUsd(request.walletAddress);
        sendResponse({ success: true, balance });
      } else if (request.action === 'getHistory') {
        const history = await electrumService.getDetailedHistory(request.walletAddress);
        sendResponse({ success: true, history });
      } else if (request.action === 'sendTransaction') {
        const txid = await electrumService.sendTransaction(request.rawTxHex);
        sendResponse({ success: true, txid });
      } else {
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error: any) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true;
});
