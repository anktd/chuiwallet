import 'webextension-polyfill';
import { walletThemeStorage } from '@extension/storage';

walletThemeStorage.get().then(theme => {
  console.log('theme', theme);
});
