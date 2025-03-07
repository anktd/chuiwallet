import type React from 'react';
import { useMemo } from 'react';
import Header from '@src/components/Header';
import AccountItem from './AccountItem';
import { ButtonOutline } from '@src/components/ButtonOutline';
import { useWalletContext } from '@src/context/WalletContext';
import { useNavigate } from 'react-router-dom';

export const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const { addAccount, selectedAccountIndex, switchAccount, totalAccounts, wallet } = useWalletContext();

  chrome.storage.local.get(null, data => {
    console.log('Stored data on password lock:', data);
  });

  const accounts = useMemo(() => {
    if (!wallet) return [];
    return Array.from({ length: totalAccounts }, (_, i) => {
      const address = wallet.generateAddress(i);
      console.log(address);

      return {
        name: `Account ${i + 1}`,
        address,
        amount: '0 USD',
      };
    });
  }, [wallet, totalAccounts]);

  return (
    <div className="flex flex-col items-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Accounts" />
      <div className="flex flex-col items-center py-4 w-full min-h-[475px] overflow-y-auto">
        {accounts.map((account, index) => (
          <AccountItem
            key={index}
            accountName={account.name}
            address={account.address}
            amount={account.amount}
            selected={index === selectedAccountIndex}
            onClick={() => {
              switchAccount(index);
              navigate('/dashboard');
            }}
          />
        ))}
      </div>
      <ButtonOutline onClick={addAccount}>Create account</ButtonOutline>
    </div>
  );
};

export default Accounts;
