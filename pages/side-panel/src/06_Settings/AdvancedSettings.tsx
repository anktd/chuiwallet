import type * as React from 'react';
import { InputField } from './InputField';
import { NetworkSelector } from './NetworkSelector';

export const AdvancedSettings: React.FC = () => {
  return (
    <div className="flex overflow-hidden flex-col pb-72 bg-neutral-900 max-w-[375px]">
      <header className="flex gap-5 justify-between items-center p-3 text-xl font-bold leading-none text-center text-white bg-neutral-900 min-h-[48px]">
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/3d9ac0a3bff262bc2e0360a3ebf4df2782c941b15a1d4333aa055f2e4a65f0ff?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
          className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
          alt=""
        />
        <div className="self-stretch w-[262px]">Advanced settings</div>
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/eead1829ee9f249cffbf31469d55efc178ccf0f07d07314bcba736da42027913?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
          className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
          alt=""
        />
      </header>

      <main className="flex flex-col self-center mt-10 w-full max-w-[328px]">
        <InputField label="Gap limit" explanation="Explanation" value="00" showReset={true} onReset={() => {}} />

        <div className="flex flex-col justify-center mt-2 w-full">
          <div className="text-base font-bold leading-none text-white">Testnets</div>
          <div className="text-xs leading-6 text-neutral-200">Switch to an available testnet</div>
        </div>

        <div className="flex flex-col mt-2 w-full font-bold">
          <NetworkSelector label="BTC Network" value="Mainnet" />
        </div>
      </main>
    </div>
  );
};
