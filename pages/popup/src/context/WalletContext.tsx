import type React from 'react';
import { createContext, useContext, useState } from 'react';
import type Wallet from '@extension/backend/src/modules/wallet.js';

interface WalletContextType {
  wallet: Wallet | null;
  password: string;
  setWallet: (wallet: Wallet, password: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWalletState] = useState<Wallet | null>(null);
  const [password, setPassword] = useState('');

  const setWallet = (walletInstance: Wallet, pwd: string) => {
    setWalletState(walletInstance);
    setPassword(pwd);
  };

  return <WalletContext.Provider value={{ wallet, password, setWallet }}>{children}</WalletContext.Provider>;
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
