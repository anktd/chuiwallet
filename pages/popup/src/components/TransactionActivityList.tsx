import type React from 'react';
import { TransactionActivityItem } from './TransactionActivityItem';
import type { TransactionActivity } from '@extension/backend/src/modules/electrumService';

interface TransactionActivityListProps {
  transactions: TransactionActivity[];
}

function formatDateForGroup(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date): string {
  const now = new Date();
  if (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  ) {
    return 'Today';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

function groupTransactionsByDate(transactions: TransactionActivity[]) {
  const groups: Record<string, TransactionActivity[]> = {};

  transactions.forEach(tx => {
    const date = new Date(tx.timestamp * 1000);
    const dateKey = formatDateForGroup(date);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(tx);
  });

  return groups;
}

export const TransactionActivityList: React.FC<TransactionActivityListProps> = ({ transactions }) => {
  const grouped = groupTransactionsByDate(transactions);
  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    return new Date(b[0]).getTime() - new Date(a[0]).getTime();
  });

  return (
    <div
      className={`flex flex-col gap-2 overflow-y-auto h-[236px] [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-track]:transparent
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-neutral-700 ${transactions.length > 3 ? 'mr-[-8px] overflow-x-visible' : ''}`}>
      {sortedGroups.map(([dateKey, txs]) => {
        const dateObj = new Date(dateKey);
        const dateLabel = formatDateLabel(dateObj);

        const sortedTxs = txs.sort((a, b) => b.timestamp - a.timestamp);

        return (
          <div key={dateKey}>
            <div className="text-gray-400 text-xs text-right pr-1 mb-2">{dateLabel}</div>
            <div className="flex flex-col gap-2">
              {sortedTxs.map(transaction => (
                <TransactionActivityItem
                  key={transaction.transactionHash}
                  type={transaction.type}
                  status={transaction.status}
                  amountBtc={transaction.amountBtc}
                  amountUsd={transaction.amountUsd}
                  feeBtc={transaction.feeBtc}
                  feeUsd={transaction.feeUsd}
                  timestamp={transaction.timestamp}
                  confirmations={transaction.confirmations}
                  transactionHash={transaction.transactionHash}
                  sender={transaction.sender}
                  receiver={transaction.receiver}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionActivityList;
