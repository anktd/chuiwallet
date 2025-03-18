import type * as React from 'react';
import Skeleton from 'react-loading-skeleton';

export interface CryptoBalanceProps {
  cryptoName: string;
  cryptoAmount: string;
  usdAmount: string;
  icon: string;
  isLoading: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const CryptoBalance: React.FC<CryptoBalanceProps> = ({
  cryptoName,
  cryptoAmount,
  usdAmount,
  icon,
  isLoading = false,
  disabled,
  onClick,
}) => {
  return (
    <button
      className="flex gap-3 justify-center items-center px-4 py-3 w-full rounded-lg bg-zinc-800 cursor-pointer"
      onClick={onClick}
      disabled={disabled}>
      <div className="flex gap-3 items-center self-stretch my-auto min-w-[312px] w-full">
        <img
          loading="lazy"
          src={chrome.runtime.getURL(icon)}
          alt={`${cryptoName} icon`}
          className="object-contain shrink-0 self-stretch my-auto w-12 aspect-square"
        />
        <div className="flex flex-col items-end flex-1 shrink self-stretch my-auto basis-0 min-w-[240px]">
          <div className="flex gap-10 justify-between items-center w-full text-white">
            <div className="gap-1 self-stretch my-auto text-base text-left font-bold leading-none whitespace-nowrap w-[120px]">
              {cryptoName}
            </div>
            {isLoading ? (
              <Skeleton className="skeleton-right !w-[120px] !h-[14px] rounded-sm" />
            ) : (
              <div className="self-stretch my-auto text-sm leading-none text-right w-full flex-grow">
                {cryptoAmount}
              </div>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="skeleton-right mt-1.5 !w-[80px] !h-[14px] rounded-sm" />
          ) : (
            <div className="gap-1 mt-1.5 w-full text-sm leading-none text-right text-foreground flex-grow">
              {usdAmount}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
