import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type Wallet from '@extension/backend/src/modules/wallet.js';
import WalletManager from '@extension/backend/src/walletManager.js';
import { getSessionPassword, setSessionPassword } from '@src/utils/sessionStorageHelper';
import type { StoredAccount } from '@src/types';

interface WalletContextType {
  wallet: Wallet | null;
  password: string;
  selectedAccountIndex: number;
  totalAccounts: number;
  onboarded: boolean;
  isRestored: boolean;
  setWallet: (wallet: Wallet, password: string) => void;
  setOnboarded: (onboarded: boolean) => void;
  switchAccount: (index: number) => void;
  nextAccount: () => void;
  addAccount: () => void;
  restoreWallet: (seed: string, password: string, network?: 'mainnet' | 'testnet', taproot?: boolean) => void;
  clearWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWalletState] = useState<Wallet | null>(null);
  const [password, setPassword] = useState('');
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(0);
  const [totalAccounts, setTotalAccounts] = useState<number>(0);
  const [onboarded, setOnboarded] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  const setWallet = (walletInstance: Wallet, pwd: string) => {
    setWalletState(walletInstance);
    setPassword(pwd);
    setSessionPassword(pwd);
  };

  const clearWallet = () => {
    setWalletState(null);
    setPassword('');
    sessionStorage.removeItem('walletPassword');
  };

  useEffect(() => {
    chrome.storage.local.get(['walletOnboarded', 'selectedAccountIndex', 'totalAccounts'], res => {
      if (res.walletOnboarded === true) {
        setOnboarded(true);
      }
      if (typeof res.selectedAccountIndex === 'number') {
        setSelectedAccountIndex(res.selectedAccountIndex);
      }
      if (typeof res.totalAccounts === 'number') {
        setTotalAccounts(res.totalAccounts);
      }
    });
  }, []);

  useEffect(() => {
    const storedPwd = getSessionPassword();
    if (storedPwd) {
      chrome.storage.local.get(['storedAccount'], async res => {
        const storedAcc: StoredAccount | undefined = res.storedAccount;
        if (storedAcc) {
          try {
            const manager = new WalletManager();

            const restoredWallet = manager.createWallet({
              password: storedPwd,
              network: storedAcc.network,
              taproot: false,
            });

            restoredWallet.restoreEncryptedMnemonic(storedAcc.encryptedMnemonic);
            const seed = restoredWallet.recoverMnemonic(storedPwd);
            if (seed) {
              setWalletState(restoredWallet);
              setPassword(storedPwd);
              setSelectedAccountIndex(storedAcc.accountIndex);
              setTotalAccounts(storedAcc.totalAccounts);
              console.log('Wallet successfully restored from storage.');
            } else {
              console.error('Failed to recover seed with stored password.');
              clearWallet();
            }
          } catch (err) {
            console.error('Error restoring wallet from storage:', err);
          }
        }
      });
    } else {
      clearWallet();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentPwd = getSessionPassword();
      if (!currentPwd) {
        clearWallet();
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const switchAccount = (index: number) => {
    if (!wallet) return;

    if (index < 0 || index >= totalAccounts) {
      console.error('Invalid account index');
      return;
    }

    wallet.setAccountIndex(index);
    setSelectedAccountIndex(index);

    chrome.storage.local.set({ selectedAccountIndex: index }, () => {
      console.log('Selected account index updated:', index);
    });

    chrome.storage.local.get(['storedAccount'], res => {
      if (res.storedAccount) {
        const storedAcc = res.storedAccount as StoredAccount;
        const newStoredAcc = { ...storedAcc, accountIndex: index };
        chrome.storage.local.set({ storedAccount: newStoredAcc }, () => {
          console.log('Stored account updated with new account index:', index);
        });
      }
    });
  };

  const nextAccount = () => {
    if (!wallet || totalAccounts === 0) return;
    const nextIndex = (selectedAccountIndex + 1) % totalAccounts;
    switchAccount(nextIndex);
  };

  const addAccount = () => {
    if (!password || !wallet) {
      console.error('Cannot add account without a wallet and password');
      return;
    }

    const newIndex = totalAccounts;
    const newTotal = newIndex + 1;
    setTotalAccounts(newTotal);

    chrome.storage.local.set({ totalAccounts: newTotal }, () => {
      console.log('Total account count updated to', newTotal);
    });

    chrome.storage.local.get(['storedAccount'], res => {
      const storedAcc: StoredAccount = res.storedAccount || {
        encryptedMnemonic: wallet.getEncryptedMnemonic()!,
        xpub: wallet.getXpub(),
        network: 'mainnet',
        accountIndex: 0,
        totalAccounts: 0,
        isRestored: false,
      };

      setIsRestored(true);

      const newStoredAcc: StoredAccount = {
        ...storedAcc,
        accountIndex: newIndex,
        totalAccounts: newTotal,
      };

      chrome.storage.local.set({ storedAccount: newStoredAcc }, () => {
        console.log('Stored account updated:', newStoredAcc);
      });
    });

    switchAccount(newIndex);
  };

  const restoreWallet = (
    seed: string,
    pwd: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    taproot: boolean = false,
  ) => {
    try {
      const manager = new WalletManager();

      const restoredWallet = manager.createWallet({
        password: pwd,
        mnemonic: seed,
        network,
        taproot,
      });

      setWallet(restoredWallet, pwd);

      const storedAccount: StoredAccount = {
        encryptedMnemonic: restoredWallet.getEncryptedMnemonic()!,
        xpub: restoredWallet.getXpub(),
        network,
        accountIndex: 0,
        totalAccounts: 1,
        isRestored: true,
      };

      chrome.storage.local.set(
        {
          storedAccount,
          selectedAccountIndex: 0,
          totalAccounts: 1,
          walletOnboarded: true,
        },
        () => {
          console.log('Wallet successfully restored from seed and persisted.');
        },
      );

      setSelectedAccountIndex(0);
      setTotalAccounts(1);
    } catch (err) {
      console.error('Error restoring wallet from seed:', err);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        password,
        selectedAccountIndex,
        totalAccounts,
        onboarded,
        isRestored,
        setWallet,
        setOnboarded,
        switchAccount,
        nextAccount,
        addAccount,
        restoreWallet,
        clearWallet,
      }}>
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
