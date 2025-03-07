import type * as React from 'react';

export interface TransactionAddressItemProps {
  type: 'receiving' | 'change';
  address: string;
  btcAmount: string;
  usdAmount: string;
  iconSrc: string;
  changeIconSrc?: string;
}

export const TransactionAddressItem: React.FC<TransactionAddressItemProps> = ({
  type,
  address,
  btcAmount,
  usdAmount,
  iconSrc,
  changeIconSrc,
}) => {
  return (
    <div className="flex gap-3 justify-center items-center py-3 w-full rounded-lg bg-zinc-800">
      <div className="flex flex-col justify-center self-stretch my-auto min-w-[240px] w-[311px]">
        <div className="flex gap-3 items-center w-full">
          <div className="flex flex-col flex-1 shrink justify-center self-stretch my-auto text-base leading-none text-white whitespace-nowrap basis-0">
            <div className="flex flex-col w-full font-bold">
              <div className="flex gap-0.5 items-center w-full">
                <div className="flex flex-col self-stretch my-auto w-[59px]">
                  <div className="flex justify-between w-full">
                    <div className="flex gap-1 items-center h-full">
                      <div className="gap-10 self-stretch my-auto">{type === 'receiving' ? 'Receiving' : 'Change'}</div>
                    </div>
                  </div>
                </div>
                {changeIconSrc && type === 'change' && (
                  <img
                    loading="lazy"
                    src={changeIconSrc}
                    alt=""
                    className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
                  />
                )}
              </div>
            </div>
            <div className="flex flex-col w-full">
              <div className="flex gap-1.5 items-center w-full">
                <div className="flex justify-between self-stretch my-auto w-[206px]">
                  <div className="flex gap-1 items-center h-full">
                    <div className="gap-10 self-stretch my-auto">{address}</div>
                  </div>
                </div>
                <img
                  loading="lazy"
                  src={iconSrc}
                  alt=""
                  className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center self-stretch my-auto text-xs leading-none">
            <div className="text-right text-foreground">{btcAmount}</div>
            <div className="text-white">{usdAmount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
