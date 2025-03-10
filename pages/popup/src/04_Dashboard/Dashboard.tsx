import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { CryptoBalance } from '../components/CryptoBalance';
import { CryptoButton } from '../components/CryptoButton';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletContext } from '@src/context/WalletContext';
import { useEffect, useState } from 'react';
import { formatAmount } from '@src/utils';
import TransactionActivityList from '@src/components/TransactionActivityList';
import type { TransactionActivity } from '@extension/backend/src/modules/electrumService';

interface BalanceData {
  confirmed: number;
  unconfirmed: number;
  confirmedUsd: number;
  unconfirmedUsd: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { selectedAccountIndex, wallet } = useWalletContext();

  const [showChooseReceiveCurrencySlide, setShowChooseReceiveCurrencySlide] = React.useState(false);
  const [showChooseSendCurrencySlide, setShowChooseSendCurrencySlide] = React.useState(false);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [history, setHistory] = useState<TransactionActivity[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [balanceLoading, setBalanceLoading] = useState<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  const handleToggleChooseReceiveCurrencySlide = () => {
    setShowChooseReceiveCurrencySlide(!showChooseReceiveCurrencySlide);
  };

  const handleToggleChooseSendCurrencySlide = () => {
    setShowChooseSendCurrencySlide(!showChooseSendCurrencySlide);
  };

  useEffect(() => {
    const fetchWalletData = () => {
      const walletAddress = wallet ? wallet.generateAddress(0) : undefined;
      if (walletAddress) {
        chrome.runtime.sendMessage({ action: 'getBalance', walletAddress }, response => {
          if (response?.success) {
            setBalance(response.balance);
          } else {
            setError(response.error);
          }
          setBalanceLoading(false);
        });

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
    <div className="relative flex overflow-hidden flex-col items-center h-full bg-dark">
      <div className="flex gap-10 justify-between items-center self-stretch p-3 w-full text-xs font-bold leading-6 bg-dark min-h-[48px] text-neutral-200">
        <button
          className="flex gap-2 justify-center items-center self-stretch px-2 my-auto rounded bg-zinc-800 cursor-pointer"
          onClick={() => navigate('/accounts')}>
          <div className="self-stretch my-auto">Account {selectedAccountIndex + 1}</div>
          <img
            loading="lazy"
            src={chrome.runtime.getURL('popup/account_down_arrow.svg')}
            alt=""
            className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
          />
        </button>

        <button onClick={() => navigate('/settings')}>
          <img
            loading="lazy"
            src={chrome.runtime.getURL('popup/menu_icon.svg')}
            alt=""
            className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
          />
        </button>
      </div>

      <div className="flex flex-col mt-10 w-40 max-w-full leading-none text-center text-white">
        <div className="flex gap-px justify-center items-center w-full text-lg">
          <div className="self-stretch my-auto">Total Balance</div>
        </div>
        <div className="flex justify-center items-end mt-2 text-5xl font-bold uppercase cursor-pointer gap-[8px] flex-wrap max-w-[300px]">
          <span>{balance ? formatAmount(balance.confirmedUsd) : '0'}</span>
          <span className="text-xl">USD</span>
        </div>
      </div>

      <div className="mt-2 text-sm leading-none text-center text-white cursor-pointer">
        {balance ? formatAmount(balance.confirmed / 1e8, 8) : '0'} BTC
      </div>

      <div className="flex gap-2.5 justify-between items-center mt-[44px] w-full text-lg font-medium leading-none text-center whitespace-nowrap max-w-[346px] text-foreground">
        <CryptoButton icon="popup/receive_icon.svg" label="Receive" onClick={handleToggleChooseReceiveCurrencySlide} />
        <CryptoButton icon="popup/send_icon.svg" label="Send" onClick={handleToggleChooseSendCurrencySlide} />
      </div>

      <div className="h-[24px] w-full"></div>

      <div className="w-full max-w-[346px]">
        <div className="flex flex-col w-full gap-[7px]">
          <div className="flex justify-between items-center">
            <span className="mb-2 text-white text-sm font-bold">Activity</span>
            <span className="mb-2 text-white text-sm">{formatAmount(history.length)} total</span>
          </div>
          <TransactionActivityList transactions={history} />
        </div>
      </div>

      {/* <div className="flex flex-col w-full max-w-[346px] gap-[7px]">
        <CryptoBalance
          cryptoName="Bitcoin"
          cryptoAmount={balance ? `${formatAmount(balance.confirmed / 1e8, 8)} BTC` : '0 BTC'}
          usdAmount={balance ? `${formatAmount(balance.confirmedUsd)} USD` : '0 USD'}
          icon="popup/btc_coin.svg"
          onClick={() => navigate('/send/btc')}
        />
        <CryptoBalance
          cryptoName="Bitcoin Cash"
          cryptoAmount="0 BCH"
          usdAmount="0 USD"
          icon="popup/bch_coin.svg"
          onClick={() => navigate('/send/bch')}
        />
        <CryptoBalance
          cryptoName="USDT"
          cryptoAmount="0 USDT"
          usdAmount="0 USD"
          icon="popup/usdt_coin.svg"
          onClick={() => navigate('/send/usdt')}
        />
      </div> */}

      <AnimatePresence>
        {showChooseReceiveCurrencySlide && (
          <motion.div
            className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleToggleChooseReceiveCurrencySlide}>
            <motion.div
              className="w-full max-w-sm bg-neutral-900 p-4 rounded-t-lg"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}>
              <div className="text-white text-xl font-bold mb-4">Choose a currency</div>
              <div className="flex flex-col w-full max-w-[346px] gap-[7px]">
                <CryptoBalance
                  cryptoName="Bitcoin"
                  cryptoAmount={balance ? `${formatAmount(balance.confirmed / 1e8, 8)} BTC` : '0 BTC'}
                  usdAmount={balance ? `${formatAmount(balance.confirmedUsd)} USD` : '0 USD'}
                  icon="popup/btc_coin.svg"
                  onClick={() => navigate('/receive/btc')}
                />
                <CryptoBalance
                  cryptoName="Bitcoin Cash"
                  cryptoAmount="0 BCH"
                  usdAmount="0 USD"
                  icon="popup/bch_coin.svg"
                  onClick={() => navigate('/receive/bch')}
                />
                <CryptoBalance
                  cryptoName="USDT"
                  cryptoAmount="0 USDT"
                  usdAmount="0 USD"
                  icon="popup/usdt_coin.svg"
                  onClick={() => navigate('/receive/usdt')}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChooseSendCurrencySlide && (
          <motion.div
            className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleToggleChooseSendCurrencySlide}>
            <motion.div
              className="w-full max-w-sm bg-neutral-900 p-4 rounded-t-lg"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}>
              <div className="text-white text-xl font-bold mb-4">Choose a currency</div>
              <div className="flex flex-col w-full max-w-[346px] gap-[7px]">
                <CryptoBalance
                  cryptoName="Bitcoin"
                  cryptoAmount={balance ? `${formatAmount(balance.confirmed / 1e8, 8)} BTC` : '0 BTC'}
                  usdAmount={balance ? `${formatAmount(balance.confirmedUsd)} USD` : '0 USD'}
                  icon="popup/btc_coin.svg"
                  onClick={() => navigate('/send/btc')}
                />
                <CryptoBalance
                  cryptoName="Bitcoin Cash"
                  cryptoAmount="0 BCH"
                  usdAmount="0 USD"
                  icon="popup/bch_coin.svg"
                  onClick={() => navigate('/send/bch')}
                />
                <CryptoBalance
                  cryptoName="USDT"
                  cryptoAmount="0 USDT"
                  usdAmount="0 USD"
                  icon="popup/usdt_coin.svg"
                  onClick={() => navigate('/send/usdt')}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
