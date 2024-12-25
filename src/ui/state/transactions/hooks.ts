import { useCallback, useMemo } from 'react';
import { KEYRING_TYPE } from '@/shared/constant';
import { RawTxInfo, ToAddressInfo } from '@/shared/types';
import { useTools } from '@/ui/components/ActionComponent';
import { useBTCUnit } from '@/ui/state/settings/hooks';
import { satoshisToAmount, satoshisToBTC, sleep, useWallet } from '@/ui/utils';
import { UnspentOutput } from '@unisat/wallet-sdk';
import { bitcoin } from '@unisat/wallet-sdk/lib/bitcoin-core';
import { AppState } from '..';
import { useAccountAddress, useCurrentAccount } from '../accounts/hooks';
import { accountActions } from '../accounts/reducer';
import { useAppDispatch, useAppSelector } from '../hooks';
import { transactionsActions } from './reducer';

export function useTransactionsState(): AppState['transactions'] {
  return useAppSelector((state) => state.transactions);
}

export function useBitcoinTx() {
  const transactionsState = useTransactionsState();
  return transactionsState.bitcoinTx;
}

export function usePrepareSendBTCCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const fromAddress = useAccountAddress();
  const utxos = useUtxos();
  const spendUnavailableUtxos = useSpendUnavailableUtxos();
  const fetchUtxos = useFetchUtxosCallback();
  const account = useCurrentAccount();
  const btcUnit = useBTCUnit();
  return useCallback(
    async ({
      toAddressInfo,
      toAmount,
      feeRate,
      enableRBF,
      memo,
      memos,
      disableAutoAdjust
    }: {
      toAddressInfo: ToAddressInfo;
      toAmount: number;
      feeRate?: number;
      enableRBF: boolean;
      memo?: string;
      memos?: string[];
      disableAutoAdjust?: boolean;
    }) => {
      let _utxos: UnspentOutput[] = (
        spendUnavailableUtxos.map((v) => {
          return Object.assign({}, v);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
      ).concat(utxos);
      if (_utxos.length === 0) {
        _utxos = await fetchUtxos();
      }
      const safeBalance = _utxos.reduce((pre, cur) => pre + cur.satoshis, 0);
      if (safeBalance < toAmount) {
        throw new Error(
          `Insufficient balance. Non-Inscription balance(${satoshisToAmount(
            safeBalance
          )} ${btcUnit}) is lower than ${satoshisToAmount(toAmount)} ${btcUnit} `
        );
      }

      if (!feeRate) {
        const summary = await wallet.getFeeSummary();
        feeRate = summary.list[1].feeRate;
      }
      let psbtHex = '';

      if (safeBalance === toAmount && !disableAutoAdjust) {
        psbtHex = await wallet.sendAllBTC({
          to: toAddressInfo.address,
          btcUtxos: _utxos,
          enableRBF,
          feeRate
        });
      } else {
        psbtHex = await wallet.sendBTC({
          to: toAddressInfo.address,
          amount: toAmount,
          btcUtxos: _utxos,
          enableRBF,
          feeRate,
          memo,
          memos
        });
      }

      const psbt = bitcoin.Psbt.fromHex(psbtHex);
      const rawtx = account.type === KEYRING_TYPE.KeystoneKeyring ? '' : psbt.extractTransaction(true).toHex();
      const fee = account.type === KEYRING_TYPE.KeystoneKeyring ? 0 : psbt.getFee();

      dispatch(
        transactionsActions.updateBitcoinTx({
          rawtx,
          psbtHex,
          fromAddress,
          feeRate,
          enableRBF
        })
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo,
        fee
      };
      return rawTxInfo;
    },
    [dispatch, wallet, fromAddress, utxos, fetchUtxos, spendUnavailableUtxos]
  );
}

export function usePushBitcoinTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const tools = useTools();
  return useCallback(
    async (rawtx: string) => {
      const ret = {
        success: false,
        txid: '',
        error: ''
      };
      try {
        tools.showLoading(true);
        const txid = await wallet.pushTx(rawtx);
        await sleep(3); // Wait for transaction synchronization
        tools.showLoading(false);
        dispatch(transactionsActions.updateBitcoinTx({ txid }));
        dispatch(accountActions.expireBalance());
        setTimeout(() => {
          dispatch(accountActions.expireBalance());
        }, 2000);
        setTimeout(() => {
          dispatch(accountActions.expireBalance());
        }, 5000);

        ret.success = true;
        ret.txid = txid;
      } catch (e) {
        ret.error = (e as Error).message;
        tools.showLoading(false);
      }

      return ret;
    },
    [dispatch, wallet]
  );
}

export function useUtxos() {
  const transactionsState = useTransactionsState();
  return transactionsState.utxos;
}

export function useFetchUtxosCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const account = useCurrentAccount();
  return useCallback(async () => {
    const data = await wallet.getBTCUtxos();
    dispatch(transactionsActions.setUtxos(data));
    return data;
  }, [wallet, account]);
}

export function useSpendUnavailableUtxos() {
  const transactionsState = useTransactionsState();
  return transactionsState.spendUnavailableUtxos;
}

export function useSetSpendUnavailableUtxosCallback() {
  const dispatch = useAppDispatch();
  return useCallback(
    (utxos: UnspentOutput[]) => {
      dispatch(transactionsActions.setSpendUnavailableUtxos(utxos));
    },
    [dispatch]
  );
}

export function useSafeBalance() {
  const utxos = useUtxos();
  return useMemo(() => {
    const satoshis = utxos.reduce((pre, cur) => pre + cur.satoshis, 0);
    return satoshisToBTC(satoshis);
  }, [utxos]);
}
