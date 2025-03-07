import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Splash from '@src/01_Splash/Splash';
import { SetPassword } from '@src/02_SetPassword/SetPassword';
import { GenerateSeed } from '@src/03_CreateWallet/GenerateSeed';
import { BackupSeed } from '@src/03_CreateWallet/BackupSeed';
import { VerifySeed } from '@src/03_CreateWallet/VerifySeed';
import { Complete } from '@src/03_CreateWallet/Complete';
import { Dashboard } from '@src/04_Dashboard/Dashboard';
import { Send } from '@src/08_Send/Send';
import { Receive } from '@src/07_Receive/Receive';
import { SendOptions } from '@src/08_Send/SendOptions';
import { TransactionConfirm } from '@src/08_Send/TransactionConfirm';
import { TransactionComplete } from '@src/08_Send/TransactionComplete';
import { TransactionList } from '@src/05_Activity/TransactionActivitiesTab';
import { Settings } from '@src/06_Settings/Settings';
import { AdvancedSettings } from '@src/06_Settings/AdvancedSettings';
import { useWalletContext } from '@src/context/WalletContext';
import { PasswordLock } from '@src/10_PasswordLock/PasswordLock';
import { RestoreSeed } from '@src/03_CreateWallet/RestoreSeed';
import { ChooseMethod } from '@src/03_CreateWallet/ChooseMethod';
import { UnlockSeed } from '@src/06_Settings/UnlockSeed';
import { RevealSeed } from '@src/06_Settings/RevealSeed';
import { Accounts } from '@src/09_Accounts/Accounts';

export const App: React.FC = () => {
  const { onboarded, wallet } = useWalletContext();

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setShowSplash(false);
      },
      onboarded ? 500 : 1000,
    );
    return () => clearTimeout(timer);
  }, [onboarded]);

  if (showSplash) {
    return <Splash />;
  }

  return (
    <Routes>
      {onboarded ? (
        wallet ? (
          <>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </>
        ) : (
          <Route path="*" element={<Dashboard />} />
        )
      ) : (
        <Route path="/" element={<Navigate to="/onboard/set-password" replace />} />
      )}
      <Route path="/onboard/set-password" element={<SetPassword />} />
      <Route path="/onboard/choose-method" element={<ChooseMethod />} />
      <Route path="/onboard/restore-seed" element={<RestoreSeed />} />
      <Route path="/onboard/generate-seed" element={<GenerateSeed />} />
      <Route path="/onboard/backup-seed" element={<BackupSeed />} />
      <Route path="/onboard/verify-seed" element={<VerifySeed />} />
      <Route path="/onboard/complete" element={<Complete />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/send/:currency" element={<Send />} />
      <Route path="/send/:currency/options" element={<SendOptions />} />
      <Route path="/send/:currency/preview" element={<TransactionConfirm />} />
      <Route path="/send/:currency/status" element={<TransactionComplete />} />
      <Route path="/receive/:currency" element={<Receive />} />
      <Route path="/transactions" element={<TransactionList />} />
      <Route path="/transactions/detail" element={<TransactionList />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/advanced" element={<AdvancedSettings />} />
      <Route path="/settings/advanced/unlock-seed" element={<UnlockSeed />} />
      <Route path="/settings/advanced/reveal-seed" element={<RevealSeed />} />
      <Route path="/accounts" element={<Accounts />} />
    </Routes>
  );
};

export default App;
