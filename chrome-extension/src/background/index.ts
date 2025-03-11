import 'webextension-polyfill';
import { walletThemeStorage } from '@extension/storage';
import ElectrumService from '@extension/backend/src/modules/electrumService';

walletThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

const electrumService = new ElectrumService();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
electrumService.connect().catch((err: any) => {
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
        sendResponse({ success: true, history: history });
      } else if (request.action === 'sendTransaction') {
        const txid = await electrumService.sendTransaction(request.rawTxHex);
        sendResponse({ success: true, txid });
      } else if (request.action === 'captureScreenshot') {
        chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl: string | undefined) => {
          if (chrome.runtime.lastError || !dataUrl) {
            sendResponse({
              success: false,
              error: chrome.runtime.lastError?.message || 'No dataUrl',
            });
            return;
          }
          sendResponse({
            success: true,
            dataUrl,
          });
        });
      } else if (request.action === 'startDragQR') {
        console.log('start drag qr');
        // chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        //   console.log(tabs);
        //   if (tabs && tabs[0]?.id !== undefined) {
        //     console.log('action sent');
        //     chrome.tabs.sendMessage(tabs[0].id, { action: 'startDragQR' });
        //   }
        // });
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          if (tabs && tabs[0]?.id !== undefined) {
            chrome.scripting.executeScript(
              {
                target: { tabId: tabs[0].id },
                files: ['script.js'],
              },
              () => {
                if (tabs && tabs[0]?.id !== undefined) {
                  chrome.tabs.sendMessage(tabs[0].id, { action: 'startDragQR' });
                }
              },
            );
          }
        });
        sendResponse({ started: true });
      } else {
        sendResponse({ success: false, error: 'Unknown action' });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true;
});
