import type * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { CryptoBalance } from '../components/CryptoBalance';
import { CryptoButton } from '../components/CryptoButton';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex overflow-hidden flex-col items-center h-full bg-dark">
      <div className="flex gap-10 justify-between items-center self-stretch p-3 w-full text-xs font-bold leading-6 bg-dark min-h-[48px] text-neutral-200">
        <div className="flex gap-0.5 justify-center items-center self-stretch px-2 my-auto rounded bg-zinc-800">
          <div className="self-stretch my-auto">Account 1</div>
          <img
            loading="lazy"
            src={chrome.runtime.getURL('popup/account_down_arrow.svg')}
            alt=""
            className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
          />
        </div>
        <img
          loading="lazy"
          src={chrome.runtime.getURL('popup/menu_icon.svg')}
          alt=""
          className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
        />
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
        <div className="mt-2 text-5xl font-bold uppercase">
          0 <span className="text-xl">USD</span>
        </div>
      </div>

      <div className="mt-2 text-sm leading-none text-center text-white">0 BTC</div>

      <div className="flex gap-2.5 justify-between items-center mt-10 w-full text-lg font-medium leading-none text-center whitespace-nowrap max-w-[346px] text-foreground">
        <CryptoButton
          icon="popup/receive_icon.svg"
          label="Receive"
          onClick={() => {
            navigate('/receive');
          }}
        />
        <CryptoButton
          icon="popup/send_icon.svg"
          label="Send"
          onClick={() => {
            navigate('/send');
          }}
        />
      </div>
      <div className="h-[49px] w-full"></div>
      <CryptoBalance cryptoName="Bitcoin" cryptoAmount="0 BTC" usdAmount="0 USD" icon="popup/bitcoin_logo.svg" />
    </div>
  );
};
