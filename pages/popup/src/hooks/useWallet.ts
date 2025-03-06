// src/hooks/useWallet.ts
import { useState, useCallback, useEffect } from 'react';
import { WalletManager } from '@extension/backend';

export interface WalletData {
  encryptedMnemonic: string | null;
  xpub: string;
  network: 'mainnet' | 'testnet';
  taproot: boolean;
}

export function useWallet() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [wallet, setWallet] = useState<any>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const createWallet = useCallback(
    async (
      password: string,
      options: { mnemonic?: string; taproot?: boolean; network?: 'mainnet' | 'testnet' } = {},
    ) => {
      const manager = new WalletManager();
      const newWallet = manager.createWallet({
        password,
        mnemonic: options.mnemonic,
        taproot: options.taproot || false,
        network: options.network || 'mainnet',
      });
      setWallet(newWallet);
      const data: WalletData = {
        encryptedMnemonic: newWallet.getEncryptedMnemonic(),
        xpub: newWallet.getXpub(),
        network: options.network || 'mainnet',
        taproot: options.taproot || false,
      };
      setWalletData(data);
      chrome.storage.local.set({ walletData: data }, () => {
        console.log('Wallet data saved locally');
      });
      setLoading(false);
      return newWallet;
    },
    [],
  );

  const revealSeed = useCallback(
    (password: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!wallet) {
          reject(new Error('Wallet not initialized'));
          return;
        }
        try {
          const seed = wallet.recoverMnemonic(password);
          resolve(seed || '');
        } catch (err) {
          reject(err);
        }
      });
    },
    [wallet],
  );

  const loadWalletData = useCallback(() => {
    chrome.storage.local.get(['walletData'], result => {
      if (result.walletData) {
        setWalletData(result.walletData);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const connectWallet = useCallback(() => {
    import('@extension/backend/src/modules/walletConnect.js').then(module => {
      module.default.openPopup();
    });
  }, []);

  return { wallet, walletData, createWallet, revealSeed, connectWallet, loading };
}
