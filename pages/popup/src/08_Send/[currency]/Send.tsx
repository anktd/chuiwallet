import { AddressInputField } from '@src/components/AddressInputField';
import { Button } from '@src/components/Button';
import Header from '@src/components/Header';
import { currencyMapping, type Currencies } from '@src/types';
import { isValidBTCAddress } from '@src/utils';
import type * as React from 'react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import WAValidator from 'wallet-address-validator';

interface SendState {
  balance: number;
}

export const Send: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currency } = useParams<{ currency: Currencies }>();
  const states = location.state as SendState;

  const [destinationAddress, setDestinationAddress] = useState('');
  const [error, setError] = useState('');

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestinationAddress(value);
    if (WAValidator.validate(value, 'BTC')) {
      setError('');
    }
  };

  const handleQRCodeClick = () => {
    chrome.runtime.sendMessage({ action: 'startDragQR' }, response => {
      if (!response || !response.started) {
        setError('Failed to start QR selection.');
      }
    });
  };

  useEffect(() => {
    const listener = (message: { action?: string; qrData?: string }) => {
      if (message.action === 'qrCodeResult' && message.qrData) {
        setDestinationAddress(message.qrData);
        setError('');
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  const handleNext = () => {
    if (!isValidBTCAddress(destinationAddress)) {
      setError('Please enter a valid BTC address');
      return;
    }
    navigate('options', {
      state: {
        destinationAddress,
        balance: states.balance,
      },
    });
  };

  return (
    <div className="relative flex flex-col items-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title={`Send ${currencyMapping[currency!]}`} />

      <img
        loading="lazy"
        src={chrome.runtime.getURL(`popup/${currency ? currency : 'unknown'}_coin.svg`)}
        alt=""
        className="object-contain mt-14 w-12 aspect-square"
      />

      <div className="mt-14 w-full text-lg font-bold relative">
        <AddressInputField
          label="Destination address"
          type="text"
          placeholder=""
          id="destinationAddress"
          value={destinationAddress}
          onChange={handleAddressChange}
          onQRClick={handleQRCodeClick}
        />
        <p className="mt-2 text-xs text-red-500 font-normal h-[20px]">{error}</p>
      </div>

      <Button className="absolute w-full bottom-[19px]" onClick={handleNext}>
        Next
      </Button>
    </div>
  );
};
