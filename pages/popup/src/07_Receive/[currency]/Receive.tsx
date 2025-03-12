import type React from 'react';
import { useState } from 'react';
import AddressQRCode from '@src/components/AddressQRCode';
import { Button } from '@src/components/Button';
import Header from '@src/components/Header';
import { useWalletContext } from '@src/context/WalletContext';
import type { Currencies } from '@src/types';
import { useParams } from 'react-router-dom';

export const Receive: React.FC = () => {
  const { wallet } = useWalletContext();
  const { currency } = useParams<{ currency: Currencies }>();
  const [copyText, setCopyText] = useState<string>('Copy address');

  // Generate address (or show fallback)
  const address = wallet ? wallet.generateAddress(0) : 'Address not found';

  const handleCopyAddress = async () => {
    try {
      if (!wallet || !address) {
        console.error('Address not found');
        return;
      }
      await navigator.clipboard.writeText(address);
      setCopyText('Copied!');
      setTimeout(() => setCopyText('Copy address'), 3000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div className="relative flex overflow-hidden flex-col text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Receive" />
      <AddressQRCode currency={currency} address={address} />
      <Button tabIndex={0} onClick={handleCopyAddress} className="absolute w-full bottom-[19px]">
        <span>{copyText}</span>
      </Button>
    </div>
  );
};
