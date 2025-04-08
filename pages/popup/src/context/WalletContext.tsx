import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import Wallet from '@extension/backend/src/modules/wallet.js';
import WalletManager from '@extension/backend/src/walletManager.js';
import {
  deleteSessionPassword,
  getSessionPassword,
  setSessionPassword,
} from '@extension/backend/src/utils/sessionStorageHelper.js';
import type { BalanceData, StoredAccount, TransactionActivity } from '@src/types';
import type { AddressType } from '@extension/backend/src/modules/wallet';

interface WalletContextType {
  wallet: Wallet | null;
  password: string;
  selectedAccountIndex: number;
  totalAccounts: number;
  selectedFiatCurrency: 'USD' | 'BTC';
  onboarded: boolean;
  isRestored: boolean;
  network: 'mainnet' | 'testnet';
  setWallet: (wallet: Wallet, password: string) => void;
  setSelectedAccountIndex: (index: number) => void;
  setTotalAccounts: (index: number) => void;
  setSelectedFiatCurrency: (currency: 'USD' | 'BTC') => void;
  setOnboarded: (onboarded: boolean) => void;
  switchAccount: (index: number) => void;
  nextAccount: () => void;
  addAccount: () => void;
  createWallet: (seed: string, password: string, network?: 'mainnet' | 'testnet', addressType?: AddressType) => void;
  restoreWallet: (seed: string, password: string, network?: 'mainnet' | 'testnet', addressType?: AddressType) => void;
  unlockWallet: (password: string) => void;
  clearWallet: () => void;
  updateNetwork: (newNetwork: 'mainnet' | 'testnet') => void;
  cachedBalances: { [accountIndex: number]: BalanceData | null };
  refreshBalance: (accountIndex: number) => void;
  refreshAllBalances: () => void;
  cachedTxHistories: { [accountIndex: number]: TransactionActivity[] | null };
  refreshTxHistory: (accountIndex: number) => void;
  logout: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWalletState] = useState<Wallet | null>(null);
  const [password, setPassword] = useState('');
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(0);
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useState<'USD' | 'BTC'>('USD');
  const [pendingNewAccountIndex, setPendingNewAccountIndex] = useState<number | null>(null);
  const [totalAccounts, setTotalAccounts] = useState<number>(0);
  const [onboarded, setOnboarded] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const [cachedBalances, setCachedBalances] = useState<{
    [accountIndex: number]: BalanceData | null;
  }>({});
  const [lastBalanceFetchMap, setLastBalanceFetchMap] = useState<{
    [accountIndex: number]: number;
  }>({});
  const [cachedTxHistories, setCachedTxHistories] = useState<{ [accountIndex: number]: TransactionActivity[] | null }>(
    {},
  );
  const [lastTxFetchMap, setLastTxFetchMap] = useState<{ [accountIndex: number]: number }>({});

  const manager = useMemo(() => new WalletManager(), []);

  const setWallet = (newWallet: Wallet, newPassword: string) => {
    setWalletState(newWallet);
    setPassword(newPassword);
    setSessionPassword(newPassword);
  };

  const clearWallet = async () => {
    setWalletState(null);
    setPassword('');
    await deleteSessionPassword();
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

        if (!storedAccount.fiatCurrency) {
          setSelectedFiatCurrency('USD');
        } else {
          setSelectedFiatCurrency(storedAccount.fiatCurrency);
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
                addressType: 'bech32',
                accountIndex: storedAccount.selectedAccountIndex,
              });

              const seed = restoredWallet.recoverMnemonic(storedPwd);
              if (seed) {
                setWalletState(restoredWallet);
                setPassword(storedPwd);
                setSelectedAccountIndex(storedAccount.selectedAccountIndex);
                setTotalAccounts(storedAccount.totalAccounts);
                setSelectedFiatCurrency(storedAccount.fiatCurrency);
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

  const switchAccount = useCallback(
    (index: number) => {
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
    },
    [totalAccounts, wallet],
  );

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

    chrome.storage.local.get(['storedAccount'], res => {
      const storedAccount: StoredAccount | undefined = res.storedAccount;
      if (storedAccount) {
        const newIndex = totalAccounts;
        const newTotal = newIndex + 1;

        const newStoredAccount: StoredAccount = {
          ...storedAccount,
          selectedAccountIndex: newIndex,
          totalAccounts: newTotal,
        };

        setTotalAccounts(newTotal);
        setPendingNewAccountIndex(newIndex);

        chrome.storage.local.set({ storedAccount: newStoredAccount }, () => {});
      }
    });
  };

  useEffect(() => {
    if (pendingNewAccountIndex !== null && pendingNewAccountIndex < totalAccounts) {
      switchAccount(pendingNewAccountIndex);
      setPendingNewAccountIndex(null);
    }
  }, [totalAccounts, pendingNewAccountIndex, switchAccount]);

  const createWallet = (
    seed: string,
    pwd: string,
    net: 'mainnet' | 'testnet' = 'mainnet',
    addressType: AddressType = 'bech32',
  ) => {
    try {
      const createdWallet = manager.createWallet({
        password: pwd,
        mnemonic: seed,
        network: net,
        addressType,
      });

      setWallet(createdWallet, pwd);

      const storedAccount: StoredAccount = {
        encryptedMnemonic: createdWallet.getEncryptedMnemonic()!,
        xpub: createdWallet.getXpub(),
        network: net,
        selectedAccountIndex: 0,
        fiatCurrency: 'USD',
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
    net: 'mainnet' | 'testnet' = 'mainnet',
    addressType: AddressType = 'bech32',
  ) => {
    try {
      const restoredWallet = manager.createWallet({
        password: pwd,
        mnemonic: seed,
        network: net,
        addressType,
      });

      setWallet(restoredWallet, pwd);
      setIsRestored(true);

      const storedAccount: StoredAccount = {
        encryptedMnemonic: restoredWallet.getEncryptedMnemonic()!,
        xpub: restoredWallet.getXpub(),
        network: net,
        selectedAccountIndex: 0,
        fiatCurrency: 'USD',
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
              addressType: 'bech32',
              accountIndex: storedAccount.selectedAccountIndex,
            });

            const seed = restoredWallet.recoverMnemonic(pwd);
            if (seed) {
              setWalletState(restoredWallet);
              setPassword(pwd);
              setSessionPassword(pwd);
              setSelectedAccountIndex(storedAccount.selectedAccountIndex);
              setTotalAccounts(storedAccount.totalAccounts);
              setSelectedFiatCurrency(storedAccount.fiatCurrency);
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

  const updateNetwork = (newNetwork: 'mainnet' | 'testnet') => {
    setNetwork(newNetwork);
    chrome.storage.local.get(['storedAccount'], res => {
      const storedAccount: StoredAccount | undefined = res.storedAccount;
      if (storedAccount) {
        storedAccount.network = newNetwork;
        chrome.storage.local.set({ storedAccount });
      }
    });
  };

  const refreshBalance = useCallback(
    (accountIndex: number) => {
      const now = Date.now();
      if (cachedBalances[accountIndex] && now - (lastBalanceFetchMap[accountIndex] || 0) < 300000) {
        return;
      }
      if (wallet) {
        const walletAddress = wallet.getAddress('bech32', accountIndex);
        if (walletAddress) {
          chrome.runtime.sendMessage({ action: 'getBalance', walletAddress }, response => {
            if (response?.success && response.balance) {
              setCachedBalances(prev => ({
                ...prev,
                [accountIndex]: response.balance,
              }));
              setLastBalanceFetchMap(prev => ({
                ...prev,
                [accountIndex]: now,
              }));
            }
          });
        }
      }
    },
    [cachedBalances, lastBalanceFetchMap, wallet],
  );

  const refreshAllBalances = useCallback(() => {
    for (let i = 0; i < totalAccounts; i++) {
      refreshBalance(i);
    }
  }, [refreshBalance, totalAccounts]);

  useEffect(() => {
    if (wallet) {
      refreshAllBalances();
    }
  }, [wallet, refreshAllBalances]);

  const refreshTxHistory = useCallback(
    (accountIndex: number) => {
      const now = Date.now();
      if (cachedTxHistories[accountIndex] && now - (lastTxFetchMap[accountIndex] || 0) < 60000) {
        return;
      }
      if (wallet) {
        const walletAddress = wallet.getAddress('bech32', accountIndex);
        if (walletAddress) {
          chrome.runtime.sendMessage({ action: 'getHistory', walletAddress }, response => {
            if (response?.success && response.history) {
              setCachedTxHistories(prev => ({
                ...prev,
                [accountIndex]: response.history,
              }));
              setLastTxFetchMap(prev => ({
                ...prev,
                [accountIndex]: now,
              }));
            }
          });
        }
      }
    },
    [cachedTxHistories, lastTxFetchMap, wallet],
  );

  useEffect(() => {
    if (wallet) {
      refreshTxHistory(selectedAccountIndex);
    }
  }, [wallet, refreshTxHistory, selectedAccountIndex]);

  useEffect(() => {
    if (wallet) {
      refreshAllBalances();
      refreshTxHistory(selectedAccountIndex);
    }
  }, [wallet, refreshAllBalances, refreshTxHistory, selectedAccountIndex]);
  const logout = () => {
    chrome.runtime.sendMessage({ action: 'logout' }, response => {
      if (response && response.success) {
        /* empty */
      } else {
        console.warn('Logout failed.');
      }
    });

    clearWallet();

    chrome.storage.local.remove(['storedAccount'], () => {
      console.log('Local stored account data cleared.');
    });

    setOnboarded(false);
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        password,
        selectedAccountIndex,
        totalAccounts,
        selectedFiatCurrency,
        onboarded,
        isRestored,
        network,
        setWallet,
        setSelectedAccountIndex,
        setTotalAccounts,
        setSelectedFiatCurrency,
        setOnboarded,
        switchAccount,
        nextAccount,
        addAccount,
        createWallet,
        restoreWallet,
        unlockWallet,
        clearWallet,
        updateNetwork,
        cachedBalances,
        refreshBalance,
        refreshAllBalances,
        cachedTxHistories,
        refreshTxHistory,
        logout,
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
