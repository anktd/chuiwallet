import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Splash from '@src/01_Splash/Splash';
import { PasswordSetup } from '@src/02_SetPassword/PasswordSetup';
import { BackupSeedPhrase } from '@src/03_CreateWallet/BackupSeedPhrase';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <Splash />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PasswordSetup />} />
        <Route path="/backup-seed" element={<BackupSeedPhrase />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
