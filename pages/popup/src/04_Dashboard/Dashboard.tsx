import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { CryptoBalance } from '../components/CryptoBalance';
import { CryptoButton } from '../components/CryptoButton';
import { motion, AnimatePresence } from 'framer-motion';
import { ButtonOutline } from '@src/components/ButtonOutline';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [showAccountSlide, setShowAccountSlide] = React.useState(false);
  const [showChooseReceiveCurrencySlide, setShowChooseReceiveCurrencySlide] = React.useState(false);
  const [showChooseSendCurrencySlide, setShowChooseSendCurrencySlide] = React.useState(false);

  const handleToggleAccountSlide = () => {
    setShowAccountSlide(!showAccountSlide);
  };

  const handleToggleChooseReceiveCurrencySlide = () => {
    setShowChooseReceiveCurrencySlide(!showChooseReceiveCurrencySlide);
  };

  const handleToggleChooseSendCurrencySlide = () => {
    setShowChooseSendCurrencySlide(!showChooseSendCurrencySlide);
  };

  return (
    <div className="relative flex overflow-hidden flex-col items-center h-full bg-dark">
      <div className="flex gap-10 justify-between items-center self-stretch p-3 w-full text-xs font-bold leading-6 bg-dark min-h-[48px] text-neutral-200">
        <button
          className="flex gap-2 justify-center items-center self-stretch px-2 my-auto rounded bg-zinc-800 cursor-pointer"
          onClick={handleToggleAccountSlide}>
          <div className="self-stretch my-auto">Account 1</div>
          <img
            loading="lazy"
            src={chrome.runtime.getURL('popup/account_down_arrow.svg')}
            alt=""
            className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
          />
        </button>

        <button>
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
          <img
            loading="lazy"
            src={chrome.runtime.getURL('popup/refresh_icon.svg')}
            alt=""
            className="object-contain shrink-0 self-stretch my-auto aspect-square w-[18px]"
          />
        </div>
        <div className="mt-2 text-5xl font-bold uppercase cursor-pointer">
          0 <span className="text-xl">USD</span>
        </div>
      </div>

      <div className="mt-2 text-sm leading-none text-center text-white cursor-pointer">0 BTC</div>

      <div className="flex gap-2.5 justify-between items-center mt-[52px] w-full text-lg font-medium leading-none text-center whitespace-nowrap max-w-[346px] text-foreground">
        <CryptoButton icon="popup/receive_icon.svg" label="Receive" onClick={handleToggleChooseReceiveCurrencySlide} />
        <CryptoButton icon="popup/send_icon.svg" label="Send" onClick={handleToggleChooseSendCurrencySlide} />
      </div>

      <div className="h-[36px] w-full"></div>

      <div className="flex flex-col w-full max-w-[346px] gap-[7px]">
        <CryptoBalance
          cryptoName="Bitcoin"
          cryptoAmount="0 BTC"
          usdAmount="0 USD"
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

      <AnimatePresence>
        {showAccountSlide && (
          <motion.div
            className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleToggleAccountSlide}>
            <motion.div
              className="w-full max-w-sm bg-neutral-900 p-4 rounded-t-lg"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}>
              <div className="text-white text-xl font-bold mb-4">Accounts</div>
              <div className="flex flex-col gap-4">
                <div className="bg-neutral-800 rounded p-2 text-white">
                  <div>Account 1</div>
                  <div className="text-xs text-neutral-400">7,956 USD</div>
                </div>
                <div className="bg-neutral-800 rounded p-2 text-white">
                  <div>Account 2</div>
                  <div className="text-xs text-neutral-400">0 USD</div>
                </div>
              </div>
              <ButtonOutline>Generate account</ButtonOutline>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  cryptoAmount="0 BTC"
                  usdAmount="0 USD"
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
                  cryptoAmount="0 BTC"
                  usdAmount="0 USD"
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
