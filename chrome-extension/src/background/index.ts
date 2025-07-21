import 'webextension-polyfill';
import Electrum from '@extension/backend/src/modules/electrum';
import { Network } from '@extension/backend/src/types/electrum';
import { walletManager } from '@extension/backend/src/walletManager';
import { getSessionPassword, setSessionPassword } from '@extension/backend/src/utils/sessionStorageHelper';
import type { Preferences } from '@extension/backend/src/modules/preferences';
import { loadPreferences } from '@extension/backend/src/modules/preferences';

let preferences: Preferences;
let electrum: Electrum;

async function initElectrum(network: Network = Network.Mainnet) {
  // if we already have a connection, kill it first
  if (electrum && typeof electrum.close === 'function') {
    electrum.close();
  }

  // create & connect a fresh instance
  electrum = new Electrum(network);
  await electrum.autoSelectAndConnect().catch(err => {
    console.error('Failed to connect to Electrum server:', err);
  });
}

async function init() {
  const sessionPassword = await getSessionPassword();
  await walletManager.init();
  if (await walletManager.restoreIfPossible(sessionPassword)) {
    await initElectrum(preferences.activeNetwork);
    // await initScanManager();
  } else {
    // Nothing / Unable to restore
  }
}

init().catch(error => {
  console.error(error);
});

// ON Meesage Command
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === 'getBalance') {
        const balance = await electrum.getBalanceWithUsd(request.walletAddress);
        sendResponse({ success: true, balance });
      } else if (request.action === 'getHistory') {
        const history = await electrum.getDetailedHistory(request.walletAddress);
        sendResponse({ success: true, history: history });
      } else if (request.action === 'getFeeEstimates') {
        const estimates = await electrum.getFeeEstimates(request.from, request.to);
        sendResponse({ success: true, estimates });
      } else if (request.action === 'getCustomFeeEstimates') {
        const customEstimate = await electrum.getCustomFeeEstimates(request.from, request.to, request.customSats);
        sendResponse({ success: true, customEstimate });
      } else if (request.action === 'sendTransaction') {
        const txid = await electrum.sendTransaction(request.rawTxHex);
        sendResponse({ success: true, txid });
      } else if (request.action === 'signAndSendTransaction') {
        // const walletData = request.walletData;
        // const walletManager = new WalletManager();
        // const wallet = walletManager.createWallet({
        //   password: walletData.password,
        //   mnemonic: walletData.mnemonic,
        //   network: walletData.network,
        //   addressType: walletData.addressType,
        //   accountIndex: walletData.accountIndex,
        // });
        // const txid = await electrum.signAndSendTransaction(wallet, request.to, request.amount, request.feeRates);
        // sendResponse({ success: true, txid });
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
      } else if (request.action === 'logout') {
        // const walletManager = new WalletManager();
        // const result = walletManager.logout();
        // sendResponse({ success: result });
        // return true;
      } else if (request.action === 'openXpub') {
        chrome.windows.create(
          {
            url: chrome.runtime.getURL('popup.html#/settings/advanced/xpub?redirectToXpub=true'),
            type: 'popup',
            width: 375,
            height: 600,
          },
          () => {
            sendResponse({ success: true });
          },
        );
        return true;
      } else {
        sendResponse({ success: false, error: 'Unknown action' });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error?.message || '' });
    }
  })();

  return true;
});

// ON Network Change
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.storedAccount) {
    console.log('Network changing to', changes.storedAccount.newValue.network);
    initElectrum(changes.storedAccount.newValue.network);
    electrum.autoSelectAndConnect().catch(err => {
      console.error('Failed to connect to Electrum server:', err);
    });
  }
});
