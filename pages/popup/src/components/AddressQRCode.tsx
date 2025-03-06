import { currencyMapping, type Currencies } from '@src/types';
import type * as React from 'react';

interface AddressSectionProps {
  currency?: Currencies | undefined;
  address: string;
}

const AddressQRCode: React.FC<AddressSectionProps> = ({ currency, address }) => {
  const currencyName = currency ? currencyMapping[currency] : 'Unknown';

  return (
    <div className="flex flex-col items-center px-16 mt-8 w-full">
      <img
        loading="lazy"
        src={chrome.runtime.getURL(`popup/${currency ? currency : 'unknown'}_coin.svg`)}
        alt={currencyName}
        className="object-contain w-12 aspect-square"
      />

      <div className="mt-6 text-2xl font-bold leading-none text-center">{currencyName} address</div>

      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/659d40f753971dfb1f9c4d1c25d826432dacc6657907274ee840604020984b83?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt="QR code for the Bitcoin address"
        className="object-contain mt-8 max-w-full aspect-square w-[168px]"
      />
      <div className="self-start mt-6 text-[1rem] leading-5 text-center btc-address">{address}</div>
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/b463c6a32268dbcebe46c0ef0464c6a5523732c89502697f23093ee277ada1d1?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt=""
        className="object-contain z-10 self-end mr-2 -mt-4 w-3 aspect-square"
      />
      <div className="flex gap-0.5 justify-center items-center py-0.5 pr-0.5 mt-6 text-xs leading-6 text-yellow-300">
        <div className="self-stretch my-auto">Get a new address</div>
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/1ef18f66fe868fcf10451afb015f26e02ac9457699b984c00c9ff1cb1c30fc25?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
          alt=""
          className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
        />
      </div>
    </div>
  );
};

export default AddressQRCode;
