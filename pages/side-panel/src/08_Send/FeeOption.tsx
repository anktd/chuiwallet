import type * as React from 'react';

export interface FeeOptionProps {
  speed: string;
  btcAmount: string;
  usdAmount: string;
}

export const FeeOption: React.FC<FeeOptionProps> = ({ speed, btcAmount, usdAmount }) => {
  return (
    <div className="flex flex-col flex-1 shrink justify-center self-stretch px-2.5 my-auto rounded-2xl border border-solid basis-0 bg-neutral-800 border-stone-900 h-[110px] min-h-[110px] w-[110px]">
      <div className="w-full text-sm font-medium leading-none whitespace-nowrap text-zinc-500">{speed}</div>
      <div className="flex flex-col items-start w-full text-xs leading-6 text-white">
        <div>{btcAmount} BTC</div>
        <div>{usdAmount} USD</div>
      </div>
    </div>
  );
};
