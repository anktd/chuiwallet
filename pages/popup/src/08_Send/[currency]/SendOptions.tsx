import type * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { currencyMapping, type Currencies } from '@src/types';
import { CurrencyInput } from '@src/components/CurrencyInput';
import { FeeOption } from '@src/components/FeeOption';
import { TransactionFee } from '@src/components/TransactionFee';
import Header from '@src/components/Header';

const feeOptions = [
  { speed: 'Slow', btcAmount: '0.000012', usdAmount: '0.95' },
  { speed: 'Medium', btcAmount: '0.000062', usdAmount: '2' },
  { speed: 'Fast', btcAmount: '0.000102', usdAmount: '5.6' },
];

export const SendOptions: React.FC = () => {
  const navigate = useNavigate();
  const { currency } = useParams<{ currency: Currencies }>();

  const handleNext = () => {
    navigate(`/send/${currency}/preview`);
  };

  return (
    <div className="flex flex-col items-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title={`Send ${currencyMapping[currency!]}`} />

      <div className="flex flex-col px-5 mt-12 w-full text-lg font-bold leading-8 text-white">
        <div className="z-10 self-start">Amount to send</div>
        <div className="flex gap-3 whitespace-nowrap">
          <CurrencyInput label="BTC" value="0.016" hasIcon={true} />
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/afd2957ce1eb1ed76d26260d58cebba08708e823bbcc3d7b9325d0410b172e89?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
            className="object-contain shrink-0 self-end mx-auto mb-5 aspect-square w-[18px]"
            alt=""
          />
          <CurrencyInput label="USD" value="1600" />
        </div>
        <button className="flex gap-1 items-center self-end mt-2 text-sm font-medium leading-none text-center text-yellow-300">
          <span className="self-stretch my-auto w-[66px]">Send Max</span>
          <div className="flex shrink-0 self-stretch my-auto w-6 h-6" />
        </button>
      </div>
      <div className="flex flex-col px-4 mt-7 w-full">
        <div className="self-start text-lg font-bold leading-8 text-white">Choose fees</div>
        <div className="flex gap-2 items-center mt-2.5 text-center">
          <div className="flex gap-2 items-center self-stretch my-auto min-w-[240px] w-[346px]">
            {feeOptions.map((option, index) => (
              <FeeOption key={index} {...option} />
            ))}
          </div>
        </div>
        <button className="flex items-center self-end mt-3 text-sm font-medium leading-none text-center text-yellow-300">
          <span className="self-stretch my-auto w-[102px]">Set custom fee</span>
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/22b47c7626b573b4d93a95fdf82a17b726728f108ca0fcc37caf97610c9cf2d8?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
            className="object-contain shrink-0 self-stretch my-auto aspect-square w-[18px]"
            alt=""
          />
        </button>
        <TransactionFee btcAmount="0.00010" usdAmount="10" />
      </div>
      <button
        className="gap-2.5 self-center px-2.5 py-3 mt-9 w-full text-lg font-bold leading-8 whitespace-nowrap bg-yellow-300 rounded-2xl max-w-[338px] text-neutral-900"
        onClick={handleNext}>
        Next
      </button>
    </div>
  );
};
