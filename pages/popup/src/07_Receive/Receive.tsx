import AddressQRCode from '@src/components/AddressQRCode';
import { Button } from '@src/components/Button';
import Header from '@src/components/Header';
import { useWalletContext } from '@src/context/WalletContext';
import type { Currencies } from '@src/types';
import type * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const Receive: React.FC = () => {
  const { wallet } = useWalletContext();
  const { currency } = useParams<{ currency: Currencies }>();
  const [copied, setCopied] = useState(false);

  chrome.storage.local.get(null, data => {
    console.log('Stored data:', data);
  });

  useEffect(() => {
    chrome.storage.local.get(['walletPassword', 'encryptedMnemonic'], async res => {
      const storedEncrypted = res.encryptedMnemonic;
      console.log('Retrieved from storage:', { storedEncrypted });
      // ...
    });
  }, []);

  console.log(wallet);

  const address = wallet ? wallet.generateAddress(0) : 'Address not found';
  console.log(address);

  const handleCopyToClipboard = async () => {
    try {
      if (!wallet || !address) {
        console.error('Address not found');
        return;
      }

      await navigator.clipboard.writeText(address);

      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy seed:', err);
    }
  };

  return (
    <div className="flex overflow-hidden flex-col justify-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Receive" />
      <AddressQRCode currency={currency} address={address} />
      <div className="relative flex flex-row justify-center items-end flex-1 w-full">
        <Button tabIndex={0} onClick={handleCopyToClipboard}>
          Copy address
        </Button>
        {copied && (
          <div className="absolute ml-1 mt-[-2px] top-0 left-full p-1 bg-body font-normal bg-neutral-700 text-foreground text-xs rounded z-[1]">
            Copied!
          </div>
        )}
      </div>
    </div>
  );
};

export default Receive;
