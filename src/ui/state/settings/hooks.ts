import compareVersions from 'compare-versions';
import { useCallback } from 'react';

import { CHAINS_MAP, ChainType, VERSION } from '@/shared/constant';
import { NetworkType } from '@/shared/types';
import { useWallet } from '@/ui/utils';

import { AppState } from '..';
import { useAppDispatch, useAppSelector } from '../hooks';
import { settingsActions } from './reducer';

export function useSettingsState(): AppState['settings'] {
  return useAppSelector((state) => state.settings);
}

export function useNetworkType() {
  const accountsState = useSettingsState();
  const chain = CHAINS_MAP[accountsState.chainType];
  if (chain) {
    return chain.networkType;
  } else {
    return NetworkType.TESTNET;
  }
}

export function useChangeNetworkTypeCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (type: NetworkType) => {
      if (type === NetworkType.MAINNET) {
        await wallet.setChainType(ChainType.BITCOIN_MAINNET);
        dispatch(
          settingsActions.updateSettings({
            chainType: ChainType.BITCOIN_MAINNET
          })
        );
      } else if (type === NetworkType.TESTNET) {
        await wallet.setChainType(ChainType.BITCOIN_TESTNET);
        dispatch(
          settingsActions.updateSettings({
            chainType: ChainType.BITCOIN_TESTNET
          })
        );
      }
    },
    [dispatch]
  );
}

export function useChainType() {
  const accountsState = useSettingsState();
  return accountsState.chainType;
}

export function useChain() {
  const accountsState = useSettingsState();
  return CHAINS_MAP[accountsState.chainType];
}

export function useChangeChainTypeCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (type: ChainType) => {
      dispatch(
        settingsActions.updateSettings({
          chainType: type
        })
      );
      await wallet.setChainType(type);
    },
    [dispatch]
  );
}

export function useBTCUnit() {
  const chainType = useChainType();
  return CHAINS_MAP[chainType].unit;
}

export function useTxExplorerUrl(txid: string) {
  const chain = useChain();
  return `${chain.mempoolSpaceUrl}/tx/${txid}`;
}

export function useAddressExplorerUrl(address: string) {
  const chain = useChain();
  return `${chain.mempoolSpaceUrl}/address/${address}`;
}

export function useWalletConfig() {
  const accountsState = useSettingsState();
  return accountsState.walletConfig;
}

export function useVersionInfo() {
  const accountsState = useSettingsState();
  const walletConfig = accountsState.walletConfig;
  const newVersion = walletConfig.version;
  const skippedVersion = accountsState.skippedVersion;
  const currentVesion = VERSION;
  let skipped = false;
  let latestVersion = '';
  // skip if new version is empty
  if (!newVersion) {
    skipped = true;
  }

  // skip if skipped
  if (newVersion == skippedVersion) {
    skipped = true;
  }

  // skip if current version is greater or equal to new version
  if (newVersion) {
    if (compareVersions(currentVesion, newVersion) >= 0) {
      skipped = true;
    } else {
      latestVersion = newVersion;
    }
  }

  // skip if current version is 0.0.0
  if (currentVesion === '0.0.0') {
    skipped = true;
  }
  return {
    currentVesion,
    newVersion,
    latestVersion,
    skipped
  };
}

export function useSkipVersionCallback() {
  const wallet = useWallet();
  const dispatch = useAppDispatch();
  return useCallback((version: string) => {
    // eslint-disable-next-line no-unused-vars
    wallet.setSkippedVersion(version).then((_v) => {
      dispatch(settingsActions.updateSettings({ skippedVersion: version }));
    });
  }, []);
}

export function useAutoLockTimeId() {
  const state = useSettingsState();
  return state.autoLockTimeId;
}
