import type * as React from 'react';
import Avvvatars from 'avvvatars-react';

interface AccountItemProps {
  accountName: string;
  address: string;
  amount: string;
  selected: boolean;
  onClick?: () => void;
}

const AccountItem: React.FC<AccountItemProps> = ({ accountName, address, amount, selected, onClick }) => {
  return (
    <button
      className={`flex gap-3 justify-center items-center px-2.5 py-3 mt-2.5 w-full rounded-lg ${
        selected ? 'bg-background-2c' : ''
      } hover:bg-background-2c max-w-[346px]`}
      onClick={onClick}>
      <div className="flex gap-3 items-center self-stretch my-auto min-w-[240px] w-[312px]">
        <Avvvatars value={address} style="shape" size={48} />

        <div className="flex flex-col flex-1 shrink self-stretch my-auto basis-0 min-w-[240px]">
          <div className="flex justify-between items-center w-full text-base font-bold leading-none text-white">
            <div className="gap-1 self-stretch text-left my-auto w-[120px]">{accountName}</div>
          </div>

          <div className="gap-1 mt-1.5 w-full text-sm leading-none text-left text-foreground">{amount}</div>
        </div>
      </div>
    </button>
  );
};

export default AccountItem;
