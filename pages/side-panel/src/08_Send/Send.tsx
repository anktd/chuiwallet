import { AddressInput } from '@src/components/AddressInput';
import { Button } from '@src/components/Button';
import type * as React from 'react';

export const SendBitcoin: React.FC = () => {
  return (
    <div className="flex overflow-hidden flex-col items-center py-5 text-lg font-bold leading-8 text-white bg-dark]">
      <div className="text-xl leading-none text-center">Send Bitcoin</div>
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/1e5d48139fa575b145176da1e93e70e998760afefa339e9c0b299ab5c4b24685?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt=""
        className="object-contain mt-14 w-12 aspect-square"
      />
      <div className="flex flex-col self-stretch px-5 pb-4 mt-14 w-full">
        <AddressInput label="Receiving address" />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/833a513aea0a7f64ec541ff08e04ee389ed22f61a65e1b17d9fc5a1743a4f1bc?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
          alt=""
          className="object-contain z-10 self-end mt-0 mr-14 w-6 aspect-square"
        />
      </div>
      <Button className="mt-72 max-w-[338px]">Next</Button>
    </div>
  );
};
