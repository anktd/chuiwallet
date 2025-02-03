import type * as React from 'react';
import type { TransactionItem } from './TransactionCard';
import { TransactionCard } from './TransactionCard';

export interface TransactionGroupProps {
  date?: string;
  transactions: TransactionItem[];
}

export const TransactionGroup: React.FC<TransactionGroupProps> = ({ date, transactions }) => {
  return (
    <>
      {date && <div className="text-xs font-bold leading-loose text-right text-neutral-400">{date}</div>}
      {transactions.map((transaction, index) => (
        <TransactionCard key={index} {...transaction} />
      ))}
    </>
  );
};
