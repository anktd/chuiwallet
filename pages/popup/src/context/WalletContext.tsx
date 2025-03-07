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
  setSelectedAccountIndex: (index: number) => void;
  setTotalAccounts: (index: number) => void;
  setOnboarded: (onboarded: boolean) => void;
  switchAccount: (index: number) => void;
  nextAccount: () => void;
  addAccount: () => void;
  createWallet: (seed: string, password: string, network?: 'mainnet' | 'testnet', taproot?: boolean) => void;
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

  const setWallet = (newWallet: Wallet, newPassword: string) => {
    setWalletState(newWallet);
    setPassword(newPassword);
    setSessionPassword(newPassword);
  };

  const clearWallet = () => {
    setWalletState(null);
    setPassword('');
    sessionStorage.removeItem('walletPassword');
  };

  useEffect(() => {
    chrome.storage.local.get(['storedAccount'], res => {
      const storedAccount: StoredAccount | undefined = res.storedAccount;
      if (storedAccount) {
        if (storedAccount.walletOnboarded === true) {
          setOnboarded(true);
        }
        if (typeof storedAccount.selectedAccountIndex === 'number') {
          setSelectedAccountIndex(storedAccount.selectedAccountIndex);
        }
        if (typeof storedAccount.totalAccounts === 'number') {
          setTotalAccounts(storedAccount.totalAccounts);
        }
      }
    });
  }, []);

  useEffect(() => {
    const storedPassword = getSessionPassword();
    if (storedPassword) {
      chrome.storage.local.get(['storedAccount'], async res => {
        const storedAccount: StoredAccount | undefined = res.storedAccount;
        if (storedAccount) {
          try {
            const manager = new WalletManager();

            const restoredWallet = manager.createWallet({
              password: storedPassword,
              network: storedAccount.network,
              taproot: storedAccount.taproot,
            });

            restoredWallet.restoreEncryptedMnemonic(storedAccount.encryptedMnemonic);
            const seed = restoredWallet.recoverMnemonic(storedPassword);
            if (seed) {
              setWallet(restoredWallet, storedPassword);
              setSelectedAccountIndex(storedAccount.selectedAccountIndex);
              setTotalAccounts(storedAccount.totalAccounts);
              // console.log('Wallet successfully restored from storage.');
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
      const currentPassword = getSessionPassword();
      if (!currentPassword) {
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

    chrome.storage.local.get(['storedAccount'], res => {
      const storedAccount: StoredAccount | undefined = res.storedAccount;
      if (storedAccount) {
        storedAccount.selectedAccountIndex = index;
        chrome.storage.local.set({ storedAccount }, () => {
          // console.log('Selected account index updated:', index);
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

    chrome.storage.local.get(['storedAccount'], res => {
      const storedAccount: StoredAccount | undefined = res.storedAccount;
      if (storedAccount) {
        const newStoredAccount: StoredAccount = {
          ...storedAccount,
          selectedAccountIndex: newIndex,
          totalAccounts: newTotal,
        };

        chrome.storage.local.set({ storedAccount: newStoredAccount }, () => {
          // console.log('Stored account updated:', newStoredAccount);
        });

        switchAccount(newIndex);
      }
    });
  };

  const createWallet = (
    seed: string,
    pwd: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    taproot: boolean = false,
  ) => {
    try {
      const manager = new WalletManager();

      const createdWallet = manager.createWallet({
        password: pwd,
        mnemonic: seed,
        network,
        taproot,
      });

      setWallet(createdWallet, pwd);

      const storedAccount: StoredAccount = {
        encryptedMnemonic: createdWallet.getEncryptedMnemonic()!,
        xpub: createdWallet.getXpub(),
        network,
        taproot: false,
        selectedAccountIndex: 0,
        totalAccounts: 1,
        isRestored: false,
        walletOnboarded: true,
      };

      chrome.storage.local.set(
        {
          storedAccount,
        },
        () => {
          // console.log('Wallet successfully created and persisted.');
        },
      );

      setSelectedAccountIndex(0);
      setTotalAccounts(1);
    } catch (err) {
      console.error('Error creating wallet:', err);
    }
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
      setIsRestored(true);

      const storedAccount: StoredAccount = {
        encryptedMnemonic: restoredWallet.getEncryptedMnemonic()!,
        xpub: restoredWallet.getXpub(),
        network,
        taproot: false,
        selectedAccountIndex: 0,
        totalAccounts: 1,
        isRestored: true,
        walletOnboarded: true,
      };

      chrome.storage.local.set(
        {
          storedAccount,
        },
        () => {
          // console.log('Wallet successfully restored from seed and persisted.');
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
        setSelectedAccountIndex,
        setTotalAccounts,
        setOnboarded,
        switchAccount,
        nextAccount,
        addAccount,
        createWallet,
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
