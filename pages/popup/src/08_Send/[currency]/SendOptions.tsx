import type * as React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { currencyMapping, type Currencies } from '@src/types';
import { AmountInputField } from '@src/components/AmountInputField';
import { FeeOption } from '@src/components/FeeOption';
import Header from '@src/components/Header';
import { useEffect, useState } from 'react';
import { getBtcToUsdRate } from '@src/utils';
import { Button } from '@src/components/Button';
import { useWalletContext } from '@src/context/WalletContext';
import type { FeeOptionSetting } from '@extension/backend/src/modules/electrumService';
import Skeleton from 'react-loading-skeleton';

interface SendOptionsState {
  destinationAddress: string;
  balance: number;
}

export const SendOptions: React.FC = () => {
  const { wallet } = useWalletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { currency } = useParams<{ currency: Currencies }>();
  const states = location.state as SendOptionsState;

  const [btcAmount, setBtcAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isCustomFee, setIsCustomFee] = useState<boolean>(false);
  const [selectedFeeIndex, setSelectedFeeIndex] = useState<number>(1);
  const [feeOptions, setFeeOptions] = useState<FeeOptionSetting[]>([]);
  const [customFeeOption, setCustomFeeOption] = useState<FeeOptionSetting | null>(null);
  const [customSats, setCustomSats] = useState('1');
  const [feeEstimatesLoading, setFeeEstimatesLoading] = useState<boolean>(false);
  const [feeCustomEstimatesLoading, setCustomFeeEstimatesLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState('');

  const handleNext = () => {
    if (btcAmount == '' || btcAmount == null || Number(btcAmount) == 0) {
      setError('Please input amount');
      return;
    }

    const feeData = isCustomFee && customFeeOption ? customFeeOption : feeOptions[selectedFeeIndex];

    const maxBtc = states.balance - feeData.btcAmount;
    if (maxBtc < Number(btcAmount)) {
      setError('Insufficient funds');
      return;
    }

    navigate(`/send/${currency}/preview`, {
      state: {
        destinationAddress: states.destinationAddress,
        amountBtc: Number(btcAmount),
        amountUsd: Number(usdAmount),
        feeBtc: feeData.btcAmount,
        feeUsd: feeData.usdAmount,
        sats: Number(feeData.sats),
      },
    });
  };

  useEffect(() => {
    async function fetchFees() {
      setFeeEstimatesLoading(true);

      const walletAddress = wallet ? wallet.generateAddress() : undefined;
      if (walletAddress) {
        chrome.runtime.sendMessage(
          { action: 'getFeeEstimates', from: walletAddress, to: states.destinationAddress },
          response => {
            if (response?.success) {
              setFeeOptions(response.estimates);
              setFeeEstimatesLoading(false);
            } else {
              setError(response.error);
              setFeeEstimatesLoading(false);
            }
          },
        );
      } else {
        setFeeEstimatesLoading(false);
      }
    }

    fetchFees();
  }, [states.destinationAddress, wallet]);

  useEffect(() => {
    async function fetchCustomFee() {
      console.log('fetchCustomFee');
      setCustomFeeEstimatesLoading(true);

      const walletAddress = wallet ? wallet.generateAddress() : undefined;
      if (walletAddress) {
        chrome.runtime.sendMessage(
          { action: 'getCustomFeeEstimates', from: walletAddress, to: states.destinationAddress, customSats },
          response => {
            if (response?.success) {
              setCustomFeeOption(response.customEstimate);
              setCustomFeeEstimatesLoading(false);
            } else {
              setError(response.error);
              setCustomFeeEstimatesLoading(false);
            }
          },
        );
      } else {
        setCustomFeeEstimatesLoading(false);
      }
    }

    if (isCustomFee) {
      fetchCustomFee();
    }
  }, [customSats, isCustomFee, states.destinationAddress, wallet]);

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
      setError('Failed to fetch exchange rates');
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
      setError('Failed to fetch exchange rates');
    }
  };

  const handleSetMaxAmount = () => {
    if (!states.balance) return;

    const feeData = isCustomFee && customFeeOption ? customFeeOption : feeOptions[selectedFeeIndex];

    const maxBtc = states.balance - feeData.btcAmount;

    if (maxBtc < 0) {
      setBtcAmount('0');
      setUsdAmount('0');
      setError('Insufficient balance');
    } else {
      setBtcAmount(maxBtc.toFixed(8));
      if (exchangeRate !== null) {
        setUsdAmount((maxBtc * exchangeRate).toFixed(2));
      }
    }
  };

  const handleSetCustomFee = () => {
    setIsCustomFee(!isCustomFee);
    if (!isCustomFee) {
      setCustomSats('1');
    }
  };

  const handleSatsChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomSats(value);
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
            disabled={feeEstimatesLoading}
          />
          <span className="mt-7 text-[20px]">=</span>
          <AmountInputField
            label="USD"
            placeholder="0 USD"
            id="usdAmount"
            value={usdAmount}
            onChange={handleUsdAmountChange}
            hasIcon={false}
            disabled={feeEstimatesLoading}
          />
        </div>
        <button
          className="flex gap-1 items-center self-end mt-2 text-sm font-medium text-center text-primary-yellow"
          onClick={handleSetMaxAmount}
          disabled={feeEstimatesLoading}>
          <span className="self-stretch my-auto">Send Max</span>
        </button>
      </div>

      <div className="flex flex-col mt-4 w-full items-end">
        <div className="self-start text-lg font-bold leading-8 text-white mb-0.5">Choose fees</div>
        <div className="flex gap-2 items-center text-center">
          <div className="flex gap-2 items-center self-stretch my-auto min-w-[240px] w-[346px]">
            {feeEstimatesLoading ? (
              <>
                <Skeleton className="!w-[110px] !h-[110px] !rounded-2xl" />
                <Skeleton className="!w-[110px] !h-[110px] !rounded-2xl" />
                <Skeleton className="!w-[110px] !h-[110px] !rounded-2xl" />
              </>
            ) : (
              <>
                {feeOptions.map((option, index) => (
                  <FeeOption
                    key={index}
                    {...option}
                    selected={selectedFeeIndex === index}
                    onSelect={() => setSelectedFeeIndex(index)}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col w-[229px] items-end text-lg font-bold">
          <button
            className="flex items-center self-end my-2 text-sm font-medium text-center text-primary-yellow"
            onClick={handleSetCustomFee}
            disabled={feeCustomEstimatesLoading}>
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
                value={customSats}
                onChange={handleSatsChanged}
                disabled={feeCustomEstimatesLoading}
              />
            </>
          )}
        </div>
      </div>

      <Button className="absolute w-full bottom-[19px]" onClick={handleNext} disabled={!btcAmount}>
        Next
      </Button>
    </div>
  );
};
