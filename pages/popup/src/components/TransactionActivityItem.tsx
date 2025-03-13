import type * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { formatNumber, timestampToTime, getStatusMeta } from '@src/utils';
import type { TransactionActivityStatus, TransactionType } from '@extension/backend/src/modules/electrumService';

export interface TransactionActivityItemProps {
  type: TransactionType;
  status: TransactionActivityStatus;
  amountBtc: number;
  amountUsd: number;
  feeBtc: number;
  feeUsd: number;
  timestamp: number;
  confirmations: number;
  transactionHash: string;
  sender: string;
  receiver: string;
}

export const TransactionActivityItem: React.FC<TransactionActivityItemProps> = props => {
  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState<boolean>(true);

  const isSent = props.type === 'SEND';
  const sign = isSent ? '-' : '+';
  const txnStatus = props.status === 'PENDING' ? 'pending' : isSent ? 'sent' : 'received';
  const { icon, label } = getStatusMeta(txnStatus);
  const formattedTime = timestampToTime(props.timestamp);

  const handleClick = () => {
    navigate(`${props.transactionHash}/detail`, {
      state: props,
    });
  };

  return (
    <button
      tabIndex={0}
      onClick={handleClick}
      className="flex w-full items-center justify-between gap-2.5 px-4 py-3 rounded-xl h-[66px]
                 bg-background-2c hover:bg-zinc-700 cursor-pointer">
      <div className="flex items-center gap-2.5">
        <img
          loading="lazy"
          src={chrome.runtime.getURL(icon)}
          alt={`${label} icon`}
          className="object-contain w-6 h-6"
        />

        <div className="flex flex-col gap-0.5">
          <div className="flex flex-row items-center text-left gap-1 text-white">
            <span className="text-sm font-bold">{label}</span>
            {props.status === 'CONFIRMED' && <span className="text-xs">{formattedTime}</span>}
          </div>
          <span className="text-sm text-foreground-79 text-left w-[160px] truncate">{props.transactionHash}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <span className="text-sm text-white text-nowrap">
          {sign}
          {formatNumber(Math.abs(props.amountUsd))} USD
        </span>
        <span className="text-sm text-foreground-79 text-nowrap">
          {sign}
          {formatNumber(Math.abs(props.amountBtc), 6)} BTC
        </span>
      </div>
    </button>
  );
};

export default TransactionActivityItem;
