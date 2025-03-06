import type * as React from 'react';

export interface CryptoBalanceProps {
  cryptoName: string;
  cryptoAmount: string;
  usdAmount: string;
  icon: string;
  onClick?: () => void;
}

export const CryptoBalance: React.FC<CryptoBalanceProps> = ({ cryptoName, cryptoAmount, usdAmount, icon, onClick }) => {
  return (
    <button
      className="flex gap-3 justify-center items-center px-2.5 py-3 w-full rounded-lg bg-zinc-800 cursor-pointer"
      onClick={onClick}>
      <div className="flex gap-3 items-center self-stretch my-auto min-w-[240px] w-[312px]">
        <img
          loading="lazy"
          src={chrome.runtime.getURL(icon)}
          alt={`${cryptoName} icon`}
          className="object-contain shrink-0 self-stretch my-auto w-12 aspect-square"
        />
        <div className="flex flex-col flex-1 shrink self-stretch my-auto basis-0 min-w-[240px]">
          <div className="flex gap-10 justify-between items-center w-full text-white">
            <div className="gap-1 self-stretch my-auto text-base text-left font-bold leading-none whitespace-nowrap w-[120px]">
              {cryptoName}
            </div>
            <div className="self-stretch my-auto text-sm leading-none">{cryptoAmount}</div>
          </div>
          <div className="gap-1 mt-1.5 w-full text-sm leading-none text-right text-foreground">{usdAmount}</div>
        </div>
      </div>
    </button>
  );
};
