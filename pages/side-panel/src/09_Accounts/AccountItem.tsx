import type * as React from 'react';

interface AccountItemProps {
  accountName: string;
  amount: string;
  backgroundColor: string;
}

const AccountItem: React.FC<AccountItemProps> = ({ accountName, amount, backgroundColor }) => {
  return (
    <div
      className={`flex gap-3 justify-center items-center px-2.5 py-3 mt-2.5 w-full rounded-lg ${backgroundColor} max-w-[346px]`}>
      <div className="flex gap-3 items-center self-stretch my-auto min-w-[240px] w-[312px]">
        <div className="flex shrink-0 self-stretch my-auto w-12 h-12 rounded-full" />
        <div className="flex flex-col flex-1 shrink self-stretch my-auto basis-0 min-w-[240px]">
          <div className="flex justify-between items-center w-full text-base font-bold leading-none text-white">
            <div className="gap-1 self-stretch my-auto w-[120px]">{accountName}</div>
          </div>
          <div className="gap-1 mt-1.5 w-full text-sm leading-none text-neutral-400">{amount}</div>
        </div>
      </div>
    </div>
  );
};

export default AccountItem;
