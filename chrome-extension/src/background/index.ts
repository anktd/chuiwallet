import { handle } from './router';
import { preferenceManager } from '@extension/backend/src/preferenceManager';
import { walletManager } from '@extension/backend/src/walletManager';
import { accountManager } from '@extension/backend/src/accountManager';
import { electrumService } from '@extension/backend/src/modules/electrumService';
import { logger } from '@extension/backend/src/utils/logger';
import { scanManager } from '@extension/backend/src/scanManager';
import browser, { Runtime } from 'webextension-polyfill';
import MessageSender = Runtime.MessageSender;
import { ChangeType } from '@extension/backend/src/types/cache';

async function init() {
  await preferenceManager.init();
  await walletManager.init();
  await electrumService.init(preferenceManager.get().activeNetwork);
  await accountManager.init(preferenceManager.get().activeAccountIndex);
  await scanManager.init();
}

(async () => {
  await init().catch(error => {
    logger.error(error);
  });
})();

async function allScan() {
  //Todo: guard if manager init
  await scanManager.forwardScan();
  await scanManager.forwardScan(ChangeType.Internal);
  await scanManager.backfillScan();
  await scanManager.backfillScan(ChangeType.Internal);
}

// Message Action Router
browser.runtime.onMessage.addListener((message: unknown, sender: MessageSender) => {
  if (!message || typeof message !== 'object' || !('action' in (message as never))) {
    return Promise.resolve({ status: 'error', error: { code: 'BAD_REQUEST', message: 'Invalid message' } });
  }
  return handle(message as never, sender);
});

// ON Network Change
// chrome.storage.onChanged.addListener((changes, area) => {
//   if (area === 'local' && changes.storedAccount) {
//     console.log('Network changing to', changes.storedAccount.newValue.network);
//     initElectrum(changes.storedAccount.newValue.network);
//     electrum.autoSelectAndConnect().catch(err => {
//       console.error('Failed to connect to Electrum server:', err);
//     });
//   }
// });

chrome.runtime.onInstalled.addListener(() => {
  console.log('onInstall');
  setupAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('onStartup');
});

function setupAlarms() {
  browser.alarms.create('forwardScan', { periodInMinutes: 3 });
  browser.alarms.create('backfillScan', { periodInMinutes: 1 });
}

browser.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === 'forwardScan') {
    // Todo: move scan queue to scan manager
    await allScan();
  }
});
