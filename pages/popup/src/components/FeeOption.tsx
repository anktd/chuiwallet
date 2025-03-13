import { capitalizeFirstLetter, formatNumber } from '@src/utils';
import type * as React from 'react';

export interface FeeOptionProps {
  speed: string;
  btcAmount: number;
  usdAmount: number;
  selected: boolean;
  onSelect?: () => void;
}

export const FeeOption: React.FC<FeeOptionProps> = ({ speed, btcAmount, usdAmount, selected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col justify-center items-center px-auto rounded-2xl border border-solid h-[110px] min-h-[110px] w-[110px] gap-1 cursor-pointer 
        ${selected ? 'bg-background-14 border-primary-yellow' : 'bg-background-2c border-background-1d'}`}>
      <div className="w-full flex justify-center">
        <img
          loading="lazy"
          src={chrome.runtime.getURL(`popup/fee_${speed}_icon.svg`)}
          alt=""
          className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
        />
      </div>
      <div className="w-full text-sm font-medium whitespace-nowrap text-zinc-500">{capitalizeFirstLetter(speed)}</div>
      <div className="flex flex-col items-center w-full text-xs text-white gap-1">
        <div>{formatNumber(btcAmount, 6)} BTC</div>
        <div>{formatNumber(usdAmount, 2)} USD</div>
      </div>
    </button>
  );
};
