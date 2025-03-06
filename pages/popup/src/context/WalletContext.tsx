import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type Wallet from '@extension/backend/src/modules/wallet.js';
import WalletManager from '@extension/backend/src/walletManager.js';

interface WalletContextType {
  wallet: Wallet | null;
  password: string;
  onboarded: boolean;
  setWallet: (wallet: Wallet, password: string) => void;
  setOnboarded: (onboarded: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWalletState] = useState<Wallet | null>(null);
  const [password, setPassword] = useState('');
  const [onboarded, setOnboarded] = useState(false);

  const setWallet = (walletInstance: Wallet, pwd: string) => {
    setWalletState(walletInstance);
    setPassword(pwd);
  };

  useEffect(() => {
    chrome.storage.local.get(['walletOnboarded'], res => {
      if (res.walletOnboarded === true) {
        setOnboarded(true);
      }
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.get(['walletPassword', 'encryptedMnemonic'], async res => {
      const storedPassword = res.walletPassword;
      const storedEncrypted = res.encryptedMnemonic;
      if (
        storedPassword &&
        typeof storedPassword === 'string' &&
        storedPassword.trim() !== '' &&
        storedEncrypted &&
        typeof storedEncrypted === 'string' &&
        storedEncrypted.trim() !== ''
      ) {
        try {
          const manager = new WalletManager();
          const restoredWallet = manager.createWallet({ password: storedPassword, network: 'mainnet', taproot: false });
          // Here, use a public restoration method if available
          const seed = restoredWallet.recoverMnemonic(storedPassword);
          if (!seed) {
            console.error('Failed to recover seed from stored data');
            return;
          }
          setWallet(restoredWallet, storedPassword);
        } catch (err) {
          console.error('Error restoring wallet from storage:', err);
        }
      }
    });
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, password, onboarded, setWallet, setOnboarded }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
