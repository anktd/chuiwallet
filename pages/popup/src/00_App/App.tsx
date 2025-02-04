import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Splash from '@src/01_Splash/Splash';
import { SetPassword } from '@src/02_SetPassword/SetPassword';
import { GenerateSeed } from '@src/03_CreateWallet/GenerateSeed';
import { BackupSeed } from '@src/03_CreateWallet/BackupSeed';
import { VerifySeed } from '@src/03_CreateWallet/VerifySeed';
import { Complete } from '@src/03_CreateWallet/Complete';
import { Dashboard } from '@src/04_Dashboard/Dashboard';
import { SendBitcoin } from '@src/08_Send/SendBitcoin';
import Receive from '@src/07_Receive/Receive';
import { SendOptions } from '@src/08_Send/SendOptions';
import { TransactionConfirm } from '@src/08_Send/TransactionConfirm';
import { TransactionComplete } from '@src/08_Send/TransactionComplete';
import { TransactionList } from '@src/05_Transaction/TransactionActivitiesTab';
import Settings from '@src/06_Settings/Settings';
import { AdvancedSettings } from '@src/06_Settings/AdvancedSettings';

export const App: React.FC = () => {
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
    <Routes>
      <Route path="/" element={<Navigate to="/onboard/set-password" replace />} />
      <Route path="/onboard/set-password" element={<SetPassword />} /> {/* SetPassword */}
      <Route path="/onboard/generate-seed" element={<GenerateSeed />} />
      <Route path="/onboard/backup-seed" element={<BackupSeed />} />
      <Route path="/onboard/verify-seed" element={<VerifySeed />} />
      <Route path="/onboard/complete" element={<Complete />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/send" element={<SendBitcoin />} />
      <Route path="/send/options" element={<SendOptions />} />
      <Route path="/send/preview" element={<TransactionConfirm />} />
      <Route path="/send/status" element={<TransactionComplete />} />
      <Route path="/receive" element={<Receive />} />
      <Route path="/transactions" element={<TransactionList />} />
      <Route path="/transactions/detail" element={<TransactionList />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/advanced" element={<AdvancedSettings />} />
      {/* <Route path="/settings/export-pk" element={<ExportPrivateKey />} /> */}
    </Routes>
  );
};

export default App;
