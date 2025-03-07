import type * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { GasLimitInputField } from '@src/components/GasLimitInputField';
import Header from '@src/components/Header';
import NetworkSelector from '@src/components/NetworkSelector';

export const AdvancedSettings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Settings" />

      <main className="flex flex-col self-center mt-10 w-full max-w-[328px]">
        <GasLimitInputField label="Gap limit" explanation="Explanation" showReset={true} onReset={() => {}} />

        <div className="flex self-start my-2 h-[1px] w-full bg-background-5f" />

        <div className="flex flex-col mt-3 mb-3 w-full font-bold">
          <NetworkSelector initialNetwork="Mainnet" options={['Mainnet', 'Testnet']} />
        </div>

        <div className="flex self-start my-2 h-[1px] w-full bg-background-5f" />

        <button
          className="flex gap-10 justify-between items-start py-2 w-full text-base leading-none text-white"
          onClick={() => navigate('/settings/advanced/unlock-seed')}>
          <span className="text-base font-bold">Reveal seed phrase</span>
          <img
            loading="lazy"
            src={chrome.runtime.getURL(`popup/right_arrow_icon.svg`)}
            alt=""
            className="object-contain shrink-0 w-6 aspect-square"
          />
        </button>
      </main>
    </div>
  );
};
