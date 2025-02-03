import type * as React from 'react';
import { CryptoBalance } from '../components/CryptoBalance';
import { CryptoButton } from '../components/CryptoButton';

export const Dashboard: React.FC = () => {
  return (
    <div className="flex overflow-hidden flex-col items-center pb-64 bg-neutral-900 max-w-[375px]">
      <div className="flex gap-10 justify-between items-center self-stretch p-3 w-full text-xs font-bold leading-6 bg-neutral-900 min-h-[48px] text-neutral-200">
        <div className="flex gap-0.5 justify-center items-center self-stretch px-2 my-auto rounded bg-zinc-800">
          <div className="self-stretch my-auto">Account 1</div>
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/04d636ce1d699f5d07a9c7ec180296a6d9eb2fbd30dc78f9adc2ec8af4863472?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
            alt=""
            className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
          />
        </div>
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/ed0b54bc7f68885b00ffadbc4977dca29f082384d1e03eb13963e267ec3365bd?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
          alt=""
          className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
        />
      </div>

      <div className="flex flex-col mt-10 w-40 max-w-full leading-none text-center text-white">
        <div className="flex gap-px justify-center items-center w-full text-lg">
          <div className="self-stretch my-auto">Total Balance</div>
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/1bcdda2f4698aea37fae449cc359a79eb0b5d41c92f9370e1fe0b0b13e8ec8d1?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
            alt=""
            className="object-contain shrink-0 self-stretch my-auto aspect-square w-[18px]"
          />
        </div>
        <div className="mt-2 text-5xl font-bold uppercase">
          0 <span className="text-xl">USD</span>
        </div>
      </div>

      <div className="mt-2 text-sm leading-none text-center text-white">0 BTC</div>

      <div className="flex gap-2.5 justify-between items-center mt-10 w-full text-lg font-medium leading-none text-center whitespace-nowrap max-w-[346px] text-neutral-400">
        <CryptoButton
          icon="https://cdn.builder.io/api/v1/image/assets/TEMP/8806279b583038ae1e2b6b129faf0f48b17cbd7e24ef94da9ceb8bd7eb395075?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
          label="Receive"
        />
        <CryptoButton
          icon="https://cdn.builder.io/api/v1/image/assets/TEMP/10a551e17b5ba2726c3f699bbb67de150c57db5038a4cb5d10a9d66bd996efdd?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
          label="Send"
        />
      </div>

      <CryptoBalance
        cryptoName="Bitcoin"
        cryptoAmount="0 BTC"
        usdAmount="0 USD"
        icon="https://cdn.builder.io/api/v1/image/assets/TEMP/41618b1e0f29fa601782c0501fa036bec5c6f63014a54acc4a021e1855a2e385?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
      />
    </div>
  );
};
