import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Header from '@src/components/Header';
import AccountItem from '../components/AccountItem';
import { ButtonOutline } from '@src/components/ButtonOutline';
import { useWalletContext } from '@src/context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '@src/utils';
import Skeleton from 'react-loading-skeleton';

export const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const { addAccount, selectedAccountIndex, switchAccount, totalAccounts, wallet } = useWalletContext();
  const containerRef = useRef<HTMLDivElement>(null);

  const [balances, setBalances] = useState<string[]>(Array(totalAccounts).fill('0 USD'));
  const [loading, setLoading] = useState<boolean>(true);

  const accounts = useMemo(() => {
    if (!wallet) return [];

    return Array.from({ length: totalAccounts }, (_, i) => {
      const address = wallet.getAddress('bech32', i);
      const balance = balances[i] || '0 USD';
      return {
        name: `Account ${i + 1}`,
        address,
        amount: balance,
      };
    });
  }, [wallet, totalAccounts, balances]);

  useEffect(() => {
    if (!wallet) return;

    const fetchBalances = async () => {
      setLoading(true);

      const balancePromises = Array.from({ length: totalAccounts }, (_, i) => {
        const address = wallet.getAddress('bech32', i);
        return new Promise<string>(resolve => {
          chrome.runtime.sendMessage({ action: 'getBalance', walletAddress: address }, response => {
            if (response?.success && response.balance !== undefined) {
              resolve(`${formatNumber(response.balance.confirmedUsd, 2)} USD`);
            } else {
              resolve('0 USD');
            }
          });
        });
      });

      const newBalances = await Promise.all(balancePromises);
      setBalances(newBalances);
      setLoading(false);
    };

    fetchBalances();
  }, [wallet, totalAccounts]);

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
            isLoading={loading}
            selected={index === selectedAccountIndex}
            onClick={() => {
              switchAccount(index);
              navigate('/dashboard');
            }}
          />
        ))}
      </div>
      {loading ? (
        <Skeleton className="absolute !w-[343px] !bottom-[-12px] !h-[58px] !rounded-[1rem]" />
      ) : (
        <>
          <ButtonOutline className="absolute w-full bottom-[19px]" onClick={addAccount}>
            Create account
          </ButtonOutline>
        </>
      )}
    </div>
  );
};

export default Accounts;
