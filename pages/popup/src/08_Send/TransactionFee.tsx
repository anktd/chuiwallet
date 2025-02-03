import type * as React from 'react';

export interface TransactionFeeProps {
  btcAmount: string;
  usdAmount: string;
}

export const TransactionFee: React.FC<TransactionFeeProps> = ({ btcAmount, usdAmount }) => {
  return (
    <div className="flex items-start self-end mt-1.5 text-lg leading-8 text-white w-[230px]">
      <div className="flex flex-col mr-0 w-full font-bold">
        <div>Transaction Fee</div>
        <div className="flex-1 shrink gap-2.5 self-stretch px-2.5 py-3 w-full rounded-2xl border border-solid bg-stone-900 border-neutral-700">
          {btcAmount} BTC
        </div>
      </div>
      <div className="mt-16 text-right">{usdAmount} USD Fee</div>
    </div>
  );
};
