import type * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { currencyMapping, type Currencies } from '@src/types';
import { AmountInputField } from '@src/components/AmountInputField';
import { FeeOption } from '@src/components/FeeOption';
import Header from '@src/components/Header';
import { useEffect, useState } from 'react';
import { getBtcToUsdRate } from '@src/utils';
import { Button } from '@src/components/Button';

const feeOptions = [
  { speed: 'slow', btcAmount: '0.000012', usdAmount: '0.95' },
  { speed: 'medium', btcAmount: '0.000062', usdAmount: '2' },
  { speed: 'fast', btcAmount: '0.000102', usdAmount: '5.6' },
];

export const SendOptions: React.FC = () => {
  const navigate = useNavigate();
  const { currency } = useParams<{ currency: Currencies }>();

  const [btcAmount, setBtcAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isCustomFee, setIsCustomFee] = useState<boolean>(false);
  const [selectedFeeIndex, setSelectedFeeIndex] = useState<number>(1);
  const [customFee, setCustomFee] = useState('3');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState('');

  const handleNext = () => {
    // Optionally, you can use feeOptions[selectedFeeIndex] later on.
    navigate(`/send/${currency}/preview`);
  };

  useEffect(() => {
    async function fetchRate() {
      try {
        const rate = await getBtcToUsdRate();
        setExchangeRate(rate);
      } catch (e) {
        console.error(e);
        setError('Failed to load exchange rate.');
      }
    }
    fetchRate();
  }, []);

  const handleBtcAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBtcAmount(value);

    const btc = parseFloat(value);
    if (exchangeRate !== null && !isNaN(btc)) {
      const usdVal = btc * exchangeRate;
      setUsdAmount(usdVal.toFixed(2));
    } else {
      setUsdAmount('');
    }
  };

  const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsdAmount(value);

    const usd = parseFloat(value);
    if (exchangeRate !== null && !isNaN(usd)) {
      const btcVal = usd / exchangeRate;
      setBtcAmount(btcVal.toFixed(8));
    } else {
      setBtcAmount('');
    }
  };

  const handleSetMaxAmount = () => {
    // Implement "Send Max" functionality as needed
  };

  const handleSetCustomFee = () => {
    setIsCustomFee(!isCustomFee);
    if (!isCustomFee) {
      setCustomFee('3');
    }
  };

  const handleCustomFeeChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomFee(value);
  };

  return (
    <div className="relative flex flex-col items-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title={`Send ${currencyMapping[currency!]}`} />

      <div className="flex flex-col mt-8 w-full text-lg font-bold leading-8 text-white">
        <div className="z-10 self-start">Amount to send</div>
        <div className="flex items-center gap-3 whitespace-nowrap">
          <AmountInputField
            label={`${currency?.toUpperCase()}`}
            placeholder={`0 ${currency?.toUpperCase()}`}
            id="btcAmount"
            value={btcAmount}
            onChange={handleBtcAmountChange}
            hasIcon={true}
            currency={currency}
          />
          <span className="mt-7 text-[20px]">=</span>
          <AmountInputField
            label="USD"
            placeholder="0 USD"
            id="usdAmount"
            value={usdAmount}
            onChange={handleUsdAmountChange}
            hasIcon={false}
          />
        </div>
        <button
          className="flex gap-1 items-center self-end mt-2 text-sm font-medium text-center text-primary-yellow"
          onClick={handleSetMaxAmount}>
          <span className="self-stretch my-auto">Send Max</span>
        </button>
      </div>

      <div className="flex flex-col mt-4 w-full items-end">
        <div className="self-start text-lg font-bold leading-8 text-white mb-0.5">Choose fees</div>
        <div className="flex gap-2 items-center text-center">
          <div className="flex gap-2 items-center self-stretch my-auto min-w-[240px] w-[346px]">
            {feeOptions.map((option, index) => (
              <FeeOption
                key={index}
                {...option}
                selected={selectedFeeIndex === index}
                onSelect={() => setSelectedFeeIndex(index)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col w-[229px] items-end text-lg font-bold">
          <button
            className="flex items-center self-end my-2 text-sm font-medium text-center text-primary-yellow"
            onClick={handleSetCustomFee}>
            <span className="self-stretch my-auto">Set Custom Fee</span>
            {isCustomFee && (
              <img
                loading="lazy"
                src={chrome.runtime.getURL('popup/close_icon.svg')}
                className="object-contain shrink-0 self-stretch my-auto aspect-square w-[18px] p-1"
                alt=""
              />
            )}
          </button>
          {isCustomFee && (
            <>
              <AmountInputField
                label=""
                placeholder="3 sat/vB"
                id="customFee"
                hasIcon={false}
                value={customFee}
                onChange={handleCustomFeeChanged}
              />
            </>
          )}
        </div>
      </div>

      <Button className="absolute w-full bottom-[19px]" onClick={handleNext}>
        Next
      </Button>
    </div>
  );
};
