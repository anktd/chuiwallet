import type * as React from 'react';

interface ImageProps {
  src: string;
  alt: string;
  className: string;
}

interface LabelValuePairProps {
  label: string;
  value: string | React.ReactNode;
}

interface TransactionDataProps {
  amount: string;
  fee: string;
  date: string;
  confirmations: string;
  transactionId: string;
  from: string;
  to: string;
}

const Image: React.FC<ImageProps> = ({ src, alt, className }) => (
  <img loading="lazy" src={src} alt={alt} className={className} />
);

const LabelValuePair: React.FC<LabelValuePairProps> = ({ label, value }) => (
  <div className="flex gap-4 items-start text-sm font-bold leading-none">
    <div className="flex flex-col w-24 text-white">
      <div>{label}</div>
    </div>
    <div className="flex flex-col text-xs leading-loose text-neutral-400 w-[201px]">{value}</div>
  </div>
);

export const TransactionDetail: React.FC<TransactionDataProps> = ({
  //   amount,
  //   fee,
  //   date,
  //   confirmations,
  transactionId,
  from,
  to,
}) => {
  return (
    <div className="flex overflow-hidden flex-col px-7 py-5 bg-neutral-900 max-w-[375px]">
      <div className="self-center text-xl font-bold leading-none text-center text-white">Transaction</div>
      <div className="flex flex-col justify-center items-center self-center mt-8 max-w-full w-[151px]">
        <div className="flex flex-col justify-center items-center px-1 w-8 h-8 bg-orange-300 bg-opacity-50 min-h-[32px] rounded-[100px]">
          <Image
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/996b33e2b348ce16342d34e4f67936494c06a0ecc5d00211b9c8b7d917c919f0?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
            alt="Transaction icon"
            className="object-contain w-full aspect-[1.29]"
          />
        </div>
        <div className="text-4xl font-bold leading-loose text-center text-white uppercase">
          1200 <span className="text-xl">usd</span>
        </div>
        <div className="text-base font-bold leading-none text-white">Sent</div>
        <div className="flex gap-1 items-center text-xs leading-loose text-neutral-400">
          <div className="self-stretch my-auto w-[54px]">0.012 BTC </div>
          <Image
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/33d98f0232a7a7ec68621d2542fed9dd15f31586abd2b3d043aff5beccc6b8fd?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
            alt=""
            className="object-contain shrink-0 self-stretch my-auto w-2 aspect-square"
          />
        </div>
      </div>
      <Image
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/fccbcb530cdba5216d0f6ced8edb35f53af9f9858d920a075fccbf7ad3c73ddc?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt="Transaction graph"
        className="object-contain mt-7 w-full aspect-[333.33]"
      />
      <LabelValuePair label="Amount" value="0.012 BTC (1200 USD)" />
      <LabelValuePair label="Fee" value="0.00012 BTC (0.093 USD)" />
      <LabelValuePair label="Date & Hour" value="24/05/25 at 10:30 PM" />
      <LabelValuePair label="Confirmations" value={<div className="text-green-500">2 confirmations</div>} />
      <Image
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/6840471a43d450d1f6b614a8d7f8d39e387e53599914946dd05f077521421fc1?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt="Transaction detail"
        className="object-contain mt-6 w-full aspect-[333.33]"
      />
      <LabelValuePair label="Transaction ID" value={transactionId} />
      <LabelValuePair label="From" value={from} />
      <LabelValuePair label="To" value={to} />
    </div>
  );
};
