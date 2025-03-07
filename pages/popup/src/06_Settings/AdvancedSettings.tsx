import type * as React from 'react';
import { InputField } from '../components/GasLimitInputField';
import { NetworkSelector } from '../components/NetworkSelector';
import Header from '@src/components/Header';

export const AdvancedSettings: React.FC = () => {
  return (
    <div className="flex flex-col text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Settings" />

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
