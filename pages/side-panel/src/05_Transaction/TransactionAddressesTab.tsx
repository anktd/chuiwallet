import type * as React from 'react';
import type { TransactionAddressItemProps } from './TransactionAddressItem';
import { TransactionAddressItem } from './TransactionAddressItem';

const transactionAddressesData: TransactionAddressItemProps[] = [
  {
    type: 'receiving',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf...',
    btcAmount: '0.0006 BTC',
    usdAmount: '58.00 USD',
    iconSrc:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/e2d6e8d259343fe53024c3a3398c045bcd3fbc9afa4dcc554fbea47e71365471?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
  },
  {
    type: 'change',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf...',
    btcAmount: '0.0006 BTC',
    usdAmount: '58.00 USD',
    iconSrc:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/9a199f95c1c00d120413cf11973c50d2b7793e99661b05f9cfba1bded61f3d1d?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
    changeIconSrc:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/31de518f56b39bc9e4ec3da4ca5b2823e83f3fa80ef7b3522d3e0ee0a78eaf34?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
  },
  {
    type: 'receiving',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf...',
    btcAmount: '0.0006 BTC',
    usdAmount: '58.00 USD',
    iconSrc:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/e7035a28417a49b2fcf76785e451aa347fd7db5cac9609a10f84a3691e43b553?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
  },
  {
    type: 'change',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf...',
    btcAmount: '0.0006 BTC',
    usdAmount: '58.00 USD',
    iconSrc:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/bdc1465c8533d50b8f878d1c02ae420c97a49fc0b425200d282219100591eb54?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
    changeIconSrc:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/ffbe883685a056bf54ae2285b15e6a24dd9b2cee62587a85dc938fe05a3b7a1d?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
  },
  {
    type: 'receiving',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf...',
    btcAmount: '0.0006 BTC',
    usdAmount: '58.00 USD',
    iconSrc:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/d93a4ad4ee4fe52d90dc2c18976fbc72a2bd207d80330b1dbceb048bbe36b5fb?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8',
  },
];

export const TransactionView: React.FC = () => {
  return (
    <div className="flex overflow-hidden flex-col py-5 pl-4 bg-dark max-w-[375px]">
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/757affc983e823c8ded401b798ef8c11fe42079d291e9de0f9a18a342202014f?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt=""
        className="object-contain w-6 aspect-square"
      />
      <div className="flex gap-10 justify-between items-start self-center mt-2 ml-3.5 w-full text-lg font-bold leading-none text-center whitespace-nowrap max-w-[258px]">
        <div className="text-white w-[88px]">Activity</div>
        <div className="w-28 text-yellow-300">Addresses</div>
      </div>
      <div className="flex gap-3 mt-9">
        <div className="flex flex-col grow shrink-0 basis-0 w-fit">
          {transactionAddressesData.map((transactionAddress, index) => (
            <div key={index} className={index > 0 ? 'mt-1.5' : ''}>
              <TransactionAddressItem {...transactionAddress} />
            </div>
          ))}
        </div>
        <div className="flex shrink-0 gap-3 self-start py-3 mt-5 w-0.5 rounded-lg bg-neutral-500 h-[83px]" />
      </div>
    </div>
  );
};
