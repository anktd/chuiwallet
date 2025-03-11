import type * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CryptoButton } from '../../components/CryptoButton';
import { useWalletContext } from '@src/context/WalletContext';
import { useEffect, useState } from 'react';
import { formatNumber } from '@src/utils';
import TransactionActivityList from '@src/components/TransactionActivityList';
import type { TransactionActivity } from '@extension/backend/src/modules/electrumService';
import Header from '@src/components/Header';

interface ActivityStates {
  balance: number;
  balanceUsd: number;
}

export const Activity: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet } = useWalletContext();

  const activityStates = location.state as ActivityStates;
  const { balance, balanceUsd } = activityStates;

  const [history, setHistory] = useState<TransactionActivity[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletData = () => {
      const walletAddress = wallet ? wallet.generateAddress(0) : undefined;
      if (walletAddress) {
        chrome.runtime.sendMessage({ action: 'getHistory', walletAddress }, response => {
          if (response?.success) {
            setHistory(response.history);
          } else {
            setError(response.error);
          }
          setHistoryLoading(false);
        });
      }
    };

    fetchWalletData();
  }, [wallet]);

  return (
    <div className="flex flex-col items-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header
        title={
          <span className="w-full flex justify-center items-center gap-1">
            <img
              loading="lazy"
              src={chrome.runtime.getURL(`popup/btc_coin.svg`)}
              alt=""
              className="object-contain shrink-0 self-stretch my-auto w-4 aspect-square"
            />
            Bitcoin
          </span>
        }
      />

      <div className="flex flex-col mt-10 w-40 max-w-full leading-none text-center text-white">
        <div className="flex gap-px justify-center items-center w-full text-lg">
          <div className="self-stretch my-auto">Total Balance</div>
        </div>
        <div className="flex justify-center items-end mt-2 text-5xl font-bold uppercase cursor-pointer gap-[8px] flex-wrap max-w-[300px]">
          <span>{balanceUsd ? formatNumber(balanceUsd) : '0'}</span>
          <span className="text-xl">USD</span>
        </div>
      </div>

      <div className="mt-2 text-sm leading-none text-center text-white cursor-pointer">
        {balance ? formatNumber(balance / 1e8, 8) : '0'} BTC
      </div>

      <div className="flex gap-2.5 justify-between items-center mt-[44px] w-full text-lg font-medium leading-none text-center whitespace-nowrap max-w-[346px] text-foreground">
        <CryptoButton icon="popup/receive_icon.svg" label="Receive" onClick={() => navigate('/receive/btc')} />
        <CryptoButton icon="popup/send_icon.svg" label="Send" onClick={() => navigate('/send/btc')} />
      </div>

      <div className="h-[24px] w-full"></div>

      <div className="w-full max-w-[346px]">
        <div className="flex flex-col w-full gap-[7px]">
          <div className="flex justify-between items-center">
            <span className="mb-2 text-white text-sm font-bold">Activity</span>
            <span className="mb-2 text-white text-sm">{formatNumber(history.length)} total</span>
          </div>
          <TransactionActivityList transactions={history} />
        </div>
      </div>
    </div>
  );
};

export default Activity;
