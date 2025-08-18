import { handle } from './router';
import { getSessionPassword, setSessionPassword } from '@extension/backend/src/utils/sessionStorageHelper';
import { preferenceManager } from '@extension/backend/src/preferenceManager';
import { walletManager } from '@extension/backend/src/walletManager';
import { accountManager } from '@extension/backend/src/accountManager';
import { electrumService } from '@extension/backend/src/modules/electrumService';
import { logger } from '@extension/backend/src/utils/logger';
import { ChangeType, scanManager } from '@extension/backend/src/scanManager';
import browser, { Runtime } from 'webextension-polyfill';
import MessageSender = Runtime.MessageSender;

async function init() {
  await preferenceManager.init();
  await walletManager.init();
  await setSessionPassword('11111111');
  const sessionPassword = await getSessionPassword();
  if (await walletManager.restoreIfPossible(sessionPassword)) {
    await electrumService.init(preferenceManager.get().activeNetwork);
    await accountManager.init(preferenceManager.get().activeAccountIndex);
    await scanManager.init();
    await scanManager.forwardScan();
    await scanManager.forwardScan(ChangeType.Internal);
  } else {
    // Unable or nothing to restore
  }
}

init().catch(error => {
  logger.error(error);
});

async function allScan() {
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
  console.log('oninstall');
  setupAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('start your engine');
});

function setupAlarms() {
  chrome.alarms.create('forwardScan', { periodInMinutes: 1 });
  chrome.alarms.create('backfillScan', { periodInMinutes: 5 });
}

browser.alarms.onAlarm.addListener(async alarm => {
  console.log(alarm);
  if (alarm.name === 'forwardScan') {
    //Todo: move scan queue to scan manager
    await allScan();
  }
});
