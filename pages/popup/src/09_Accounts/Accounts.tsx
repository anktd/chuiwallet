import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import Header from '@src/components/Header';
import AccountItem from '../components/AccountItem';
import { ButtonOutline } from '@src/components/ButtonOutline';
import { useWalletContext } from '@src/context/WalletContext';
import { useNavigate } from 'react-router-dom';

export const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const { addAccount, selectedAccountIndex, switchAccount, totalAccounts, wallet } = useWalletContext();

  const containerRef = useRef<HTMLDivElement>(null);

  const accounts = useMemo(() => {
    if (!wallet) return [];

    return Array.from({ length: totalAccounts }, (_, i) => {
      const address = wallet.getAddress('p2pkh', i);

      return {
        name: `Account ${i + 1}`,
        address,
        amount: '0 USD',
      };
    });
  }, [wallet, totalAccounts]);

  useEffect(() => {}, [selectedAccountIndex]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [accounts.length]);

  return (
    <div className="relative flex flex-col items-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Accounts" />
      <div
        ref={containerRef}
        className={`flex flex-col items-center w-full h-[452px] mt-2 overflow-y-auto gap-2 [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:rounded-full
      [&::-webkit-scrollbar-track]:transparent
      [&::-webkit-scrollbar-thumb]:rounded-full
      [&::-webkit-scrollbar-thumb]:bg-neutral-700 ${accounts.length > 5 ? 'mr-[-12px] overflow-x-visible' : ''}`}>
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
      <ButtonOutline className="absolute w-full bottom-[19px]" onClick={addAccount}>
        Create account
      </ButtonOutline>
    </div>
  );
};

export default Accounts;
