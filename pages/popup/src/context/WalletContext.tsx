import type React from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import Wallet from '@extension/backend/src/modules/wallet.js';
import WalletManager from '@extension/backend/src/walletManager.js';
import { getSessionPassword, SESSION_PASSWORD_KEY, setSessionPassword } from '@src/utils/sessionStorageHelper';
import type { StoredAccount } from '@src/types';
import type { AddressType } from '@extension/backend/dist/modules/wallet';

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
  createWallet: (seed: string, password: string, network?: 'mainnet' | 'testnet', addressType?: AddressType) => void;
  restoreWallet: (seed: string, password: string, network?: 'mainnet' | 'testnet', addressType?: AddressType) => void;
  unlockWallet: (password: string) => void;
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

  const manager = useMemo(() => new WalletManager(), []);

  const setWallet = (newWallet: Wallet, newPassword: string) => {
    setWalletState(newWallet);
    setPassword(newPassword);
    setSessionPassword(newPassword);
  };

  const clearWallet = async () => {
    setWalletState(null);
    setPassword('');
    await chrome.storage.session.remove([SESSION_PASSWORD_KEY]);
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
    (async () => {
      const storedPwd = await getSessionPassword();
      if (storedPwd) {
        chrome.storage.local.get(['storedAccount'], res => {
          const storedAccount: StoredAccount | undefined = res.storedAccount;
          if (storedAccount) {
            try {
              const restoredMnemonic = Wallet.getDecryptedMnemonic(storedAccount.encryptedMnemonic, storedPwd);
              if (!restoredMnemonic) {
                console.error('Failed to recover seed with stored password.');
                clearWallet();
              }

              const restoredWallet = manager.createWallet({
                password: storedPwd!,
                mnemonic: restoredMnemonic!,
                network: storedAccount.network,
                addressType: 'p2pkh',
                accountIndex: storedAccount.selectedAccountIndex,
              });

              const seed = restoredWallet.recoverMnemonic(storedPwd);
              if (seed) {
                setWalletState(restoredWallet);
                setPassword(storedPwd);
                setSelectedAccountIndex(storedAccount.selectedAccountIndex);
                setTotalAccounts(storedAccount.totalAccounts);
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
    })();
  }, [manager]);

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

    chrome.storage.local.get(['storedAccount'], res => {
      const storedAccount: StoredAccount | undefined = res.storedAccount;
      if (storedAccount) {
        storedAccount.selectedAccountIndex = index;
        chrome.storage.local.set({ storedAccount }, () => {});
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

        chrome.storage.local.set({ storedAccount: newStoredAccount }, () => {});

        switchAccount(newIndex);
      }
    });
  };

  const createWallet = (
    seed: string,
    pwd: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    addressType: AddressType = 'p2pkh',
  ) => {
    try {
      const createdWallet = manager.createWallet({
        password: pwd,
        mnemonic: seed,
        network,
        addressType,
      });

      setWallet(createdWallet, pwd);

      const storedAccount: StoredAccount = {
        encryptedMnemonic: createdWallet.getEncryptedMnemonic()!,
        xpub: createdWallet.getXpub(),
        network,
        selectedAccountIndex: 0,
        totalAccounts: 1,
        isRestored: false,
        walletOnboarded: true,
      };

      chrome.storage.local.set(
        {
          storedAccount,
        },
        () => {},
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
    addressType: AddressType = 'p2pkh',
  ) => {
    try {
      const restoredWallet = manager.createWallet({
        password: pwd,
        mnemonic: seed,
        network,
        addressType,
      });

      setWallet(restoredWallet, pwd);
      setIsRestored(true);

      const storedAccount: StoredAccount = {
        encryptedMnemonic: restoredWallet.getEncryptedMnemonic()!,
        xpub: restoredWallet.getXpub(),
        network,
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

  const unlockWallet = (pwd: string) => {
    if (pwd) {
      chrome.storage.local.get(['storedAccount'], res => {
        const storedAccount: StoredAccount | undefined = res.storedAccount;
        if (storedAccount) {
          try {
            const restoredMnemonic = Wallet.getDecryptedMnemonic(storedAccount.encryptedMnemonic, pwd);
            if (!restoredMnemonic) {
              console.error('Failed to recover seed with stored password.');
              clearWallet();
            }

            const restoredWallet = manager.createWallet({
              password: pwd!,
              mnemonic: restoredMnemonic!,
              network: storedAccount.network,
              addressType: 'p2pkh',
              accountIndex: storedAccount.selectedAccountIndex,
            });

            const seed = restoredWallet.recoverMnemonic(pwd);
            if (seed) {
              setWalletState(restoredWallet);
              setPassword(pwd);
              setSessionPassword(pwd);
              setSelectedAccountIndex(storedAccount.selectedAccountIndex);
              setTotalAccounts(storedAccount.totalAccounts);
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
        unlockWallet,
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
