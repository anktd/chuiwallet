import { AddressInput } from '@src/components/AddressInput';
import { Button } from '@src/components/Button';
import type { Currencies } from '@src/types';
import { currencyMapping } from '@src/types';
import type * as React from 'react';
import { useParams } from 'react-router-dom';

export const Send: React.FC = () => {
  const { currency } = useParams<{ currency: Currencies }>();

  return (
    <div className="flex overflow-hidden flex-col justify-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <div className="text-xl leading-none text-center">Send {currency ? currencyMapping[currency] : 'Unknown'}</div>
      <img
        loading="lazy"
        src={chrome.runtime.getURL(`popup/${currency ? currency : 'unknown'}_coin.svg`)}
        alt=""
        className="object-contain mt-14 w-12 aspect-square"
      />
      <div className="flex flex-col self-stretch px-5 pb-4 mt-14 w-full">
        <AddressInput label="Receiving address" />
        <img
          loading="lazy"
          src={chrome.runtime.getURL(`popup/copy_icon.svg`)}
          alt=""
          className="object-contain z-10 self-end mt-0 mr-14 w-6 aspect-square"
        />
      </div>
      <Button className="mt-72 max-w-[338px]">Next</Button>
    </div>
  );
};
