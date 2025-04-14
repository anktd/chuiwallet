import { currencyMapping, type Currencies } from '@src/types';
import type * as React from 'react';
import { useState } from 'react';
import QRCode from 'react-qr-code';

interface XpubQRCodeProps {
  currency?: Currencies | undefined;
  xpub: string;
}

const XpubQRCode: React.FC<XpubQRCodeProps> = ({ currency, xpub }) => {
  const currencyName = currency ? currencyMapping[currency] : 'Unknown';
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      if (!xpub) {
        console.error('xPub not found');
        return;
      }

      await navigator.clipboard.writeText(xpub);

      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy seed:', err);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <img
        loading="lazy"
        src={chrome.runtime.getURL(`popup/${currency ? currency : 'unknown'}_coin.svg`)}
        alt={currencyName}
        className="object-contain w-12 aspect-square"
      />

      <div className="mt-6 text-2xl font-bold leading-none text-center">Extended Public Key</div>

      <QRCode value={xpub} size={178} level="H" className="object-contain max-w-full mt-4 aspect-square w-[168px]" />

      <div className="relative flex flex-col w-full max-w-[224px]">
        <button
          className="flex flex-start self-start text-[1rem] leading-5 text-center btc-address w-full"
          onClick={handleCopyToClipboard}>
          <span className="overflow-wrap text-wrap w-full mt-4">{xpub}</span>
          <img
            loading="lazy"
            src={chrome.runtime.getURL(`popup/copy_icon.svg`)}
            alt=""
            className="object-contain z-10 self-end mb-1 ml-[-15px] w-3 aspect-square"
          />
        </button>

        {copied && (
          <div className="absolute ml-1 mt-14 top-0 left-full p-1 bg-body font-normal bg-neutral-700 text-foreground text-xs rounded z-[1]">
            Copied!
          </div>
        )}
      </div>
    </div>
  );
};

export default XpubQRCode;
