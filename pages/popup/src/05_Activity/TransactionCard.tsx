import type * as React from 'react';

export interface TransactionItem {
  type: 'pending' | 'sent' | 'received';
  time: string;
  date?: string;
  amount: string;
  btcAmount: string;
  address: string;
  iconBgColor: string;
  iconSrc?: string;
}

export type TransactionCardProps = TransactionItem;

export const TransactionCard: React.FC<TransactionCardProps> = ({
  type,
  time,
  amount,
  btcAmount,
  address,
  iconBgColor,
  iconSrc,
}) => {
  return (
    <div className="flex gap-3 justify-center items-center px-2.5 py-3 w-full rounded-lg bg-zinc-800">
      <div className="flex gap-3 items-center self-stretch my-auto min-w-[240px]">
        <div
          className={`flex flex-col justify-center items-center self-stretch px-1 my-auto w-8 h-8 ${iconBgColor} min-h-[32px] rounded-[100px]`}>
          {iconSrc && (
            <img
              loading="lazy"
              src={iconSrc}
              alt={`${type} transaction icon`}
              className="object-contain aspect-[1.29] w-[18px]"
            />
          )}
        </div>
        <div className="flex flex-col self-stretch my-auto min-w-[240px] w-[276px]">
          <div className="flex gap-10 justify-between w-full text-white">
            <div className="flex gap-2.5 justify-center items-center h-full w-[92px]">
              <div className="flex gap-1 items-center self-stretch my-auto w-[92px]">
                <div className="self-stretch my-auto text-base font-bold leading-none">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
                <div className="self-stretch my-auto text-xs leading-loose">{time}</div>
              </div>
            </div>
            <div className="my-auto text-sm leading-none">{amount}</div>
          </div>
          <div className="flex gap-4 justify-between items-start mt-1.5 w-full text-sm leading-none text-neutral-500">
            <div>{address}</div>
            <div className="text-right">{btcAmount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
