import '@src/01_Splash/Splash.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { walletThemeStorage } from '@extension/storage';

const Splash = () => {
  const theme = useStorage(walletThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'popup/logo_black.svg' : 'popup/logo_light.svg';

  return (
    <div className="bg-splash flex items-center justify-center">
      <img src={chrome.runtime.getURL(logo)} className="Chui" alt="logo" />
    </div>
  );
};

const LoadingScreen = () => (
  <div className="bg-splash flex items-center justify-center">
    <img src={chrome.runtime.getURL('loading-icon.svg')} alt="Loading..." className="w-12 h-12 animate-spin" />
  </div>
);

const ErrorScreen = () => (
  <div className="bg-splash flex items-center justify-center">
    <img src={chrome.runtime.getURL('error-icon.svg')} alt="Error Occurred" className="w-12 h-12" />
  </div>
);

export default withErrorBoundary(withSuspense(Splash, <LoadingScreen />), <ErrorScreen />);
