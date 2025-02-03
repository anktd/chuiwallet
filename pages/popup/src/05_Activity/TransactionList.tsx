import type * as React from 'react';
import type { TransactionItem } from './TransactionCard';
import { TransactionGroup } from './TransactionGroup';

const transactionData: { date?: string; transactions: TransactionItem[] }[] = [
  {
    date: 'Today',
    transactions: [
      {
        type: 'pending',
        time: '10:30 AM',
        amount: '-58.00$',
        btcAmount: '-0.0006 BTC',
        address: '0x2170ed0880ac9a755fd...',
        iconBgColor: 'bg-zinc-500 bg-opacity-50',
      },
      {
        type: 'sent',
        time: '10:30 AM',
        amount: '-58.00$',
        btcAmount: '-0.0006 BTC',
        address: '0x2170ed0880ac9a755fd...',
        iconBgColor: 'bg-orange-300 bg-opacity-50',
        iconSrc:
          'https://cdn.builder.io/api/v1/image/assets/TEMP/65effd435a101a0b33a8bf06e915bcc9c63a4eabda7ba535b580c9ccb5f13332?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
      },
      {
        type: 'received',
        time: '10:30 AM',
        amount: '-58.00$',
        btcAmount: '-0.0006 BTC',
        address: '0x2170ed0880ac9a755fd...',
        iconBgColor: 'bg-green-400 bg-opacity-50',
        iconSrc:
          'https://cdn.builder.io/api/v1/image/assets/TEMP/a7dce02d39fb7df1147da65ec55e48855038434cbd1083ad9c407a9accb7af82?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
      },
    ],
  },
  {
    date: '24/05/2021',
    transactions: [
      {
        type: 'received',
        time: '10:30 AM',
        amount: '-58.00$',
        btcAmount: '-0.0006 BTC',
        address: '0x2170ed0880ac9a755fd...',
        iconBgColor: 'bg-green-400 bg-opacity-50',
        iconSrc:
          'https://cdn.builder.io/api/v1/image/assets/TEMP/a7dce02d39fb7df1147da65ec55e48855038434cbd1083ad9c407a9accb7af82?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
      },
    ],
  },
  {
    date: '23/05/2021',
    transactions: [
      {
        type: 'received',
        time: '10:30 AM',
        amount: '-58.00$',
        btcAmount: '-0.0006 BTC',
        address: '0x2170ed0880ac9a755fd...',
        iconBgColor: 'bg-green-400 bg-opacity-50',
        iconSrc:
          'https://cdn.builder.io/api/v1/image/assets/TEMP/a7dce02d39fb7df1147da65ec55e48855038434cbd1083ad9c407a9accb7af82?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
      },
      {
        type: 'received',
        time: '10:30 AM',
        amount: '-58.00$',
        btcAmount: '-0.0006 BTC',
        address: '0x2170ed0880ac9a755fd...',
        iconBgColor: 'bg-green-400 bg-opacity-50',
        iconSrc:
          'https://cdn.builder.io/api/v1/image/assets/TEMP/a7dce02d39fb7df1147da65ec55e48855038434cbd1083ad9c407a9accb7af82?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
      },
      {
        type: 'received',
        time: '10:30 AM',
        amount: '-58.00$',
        address: '0x2170ed0880ac9a755fd...',
        iconBgColor: 'bg-green-400 bg-opacity-50',
        iconSrc:
          'https://cdn.builder.io/api/v1/image/assets/TEMP/a7dce02d39fb7df1147da65ec55e48855038434cbd1083ad9c407a9accb7af82?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
        btcAmount: '-0.0006 BTC',
      },
    ],
  },
];

export const TransactionList: React.FC = () => {
  return (
    <div className="flex overflow-hidden flex-col px-4 pt-5 bg-neutral-900 max-w-[375px]">
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/430cc9db9c6ce5b015bc2ceab579bfda683de6c06bd54dfadbdb69c5793d08d7?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt="Transaction header icon"
        className="object-contain w-6 aspect-square"
      />
      <div className="flex gap-10 justify-between items-start self-center mt-2 ml-3.5 w-full text-lg font-bold leading-none text-center whitespace-nowrap max-w-[258px]">
        <div className="text-yellow-300 w-[88px]">Activity</div>
        <div className="w-28 text-white">Addresses</div>
      </div>
      <div className="flex flex-col mt-7 w-full">
        {transactionData.map((group, index) => (
          <TransactionGroup key={index} date={group.date} transactions={group.transactions} />
        ))}
      </div>
    </div>
  );
};
