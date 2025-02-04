import type * as React from 'react';
import Header from '@src/components/Header';
import AccountItem from './AccountItem';
import { ButtonOutline } from '@src/components/ButtonOutline';

const accounts = [
  { name: 'Account 1', amount: '7,956 USD', backgroundColor: '' },
  { name: 'Account 2', amount: '0 USD', backgroundColor: 'bg-zinc-800' },
];

const CreateAccount: React.FC = () => {
  return (
    <div className="flex overflow-hidden flex-col items-center pb-5 bg-dark]">
      <Header title={''} />
      {accounts.map((account, index) => (
        <AccountItem
          key={index}
          accountName={account.name}
          amount={account.amount}
          backgroundColor={account.backgroundColor}
        />
      ))}
      <ButtonOutline>Create account</ButtonOutline>
    </div>
  );
};

export default CreateAccount;
