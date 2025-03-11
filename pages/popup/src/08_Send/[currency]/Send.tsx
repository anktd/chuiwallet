import { AddressInputField } from '@src/components/AddressInputField';
import { Button } from '@src/components/Button';
import Header from '@src/components/Header';
import { currencyMapping, type Currencies } from '@src/types';
import { isValidBTCAddress } from '@src/utils';
import type * as React from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WAValidator from 'wallet-address-validator';

export const Send: React.FC = () => {
  const navigate = useNavigate();
  const { currency } = useParams<{ currency: Currencies }>();

  const [destinationAddress, setDestinationAddress] = useState('');
  const [error, setError] = useState('');

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestinationAddress(value);
    if (WAValidator.validate(value, 'BTC')) {
      setError('');
    }
  };

  const handleNext = () => {
    if (!isValidBTCAddress(destinationAddress)) {
      setError('Please enter a valid BTC address');
      return;
    }

    navigate('options');
  };

  return (
    <div className="flex flex-col items-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title={`Send ${currencyMapping[currency!]}`} />

      <img
        loading="lazy"
        src={chrome.runtime.getURL(`popup/${currency ? currency : 'unknown'}_coin.svg`)}
        alt=""
        className="object-contain mt-14 w-12 aspect-square"
      />

      <div className="mt-14 w-full text-lg font-bold">
        <AddressInputField
          label="Destination address"
          type="text"
          placeholder=""
          id="destinationAddress"
          value={destinationAddress}
          onChange={handleAddressChange}
        />
        <p className="mt-2 text-xs text-red-500 font-normal h-[20px]">{error}</p>
      </div>

      <Button className="mt-[200px] w-full" onClick={handleNext}>
        Next
      </Button>
    </div>
  );
};
