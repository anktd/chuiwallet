import type * as React from 'react';
import type { Network } from '@src/types';
import { useNavigate } from 'react-router-dom';
import { GasLimitInputField } from '@src/components/GasLimitInputField';
import Header from '@src/components/Header';
import NetworkSelector from '@src/components/NetworkSelector';
import { useWalletContext } from '@src/context/WalletContext';
import { useEffect, useState } from 'react';
import { sendMessage } from '@src/utils/bridge';

export const AdvancedSettings: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, setPreferences } = useWalletContext();
  const [localGap, setLocalGap] = useState<string>(preferences.gapLimitReceive.toString());
  const displayNetwork = preferences?.activeNetwork === 'mainnet' ? 'Mainnet' : 'Testnet';

  useEffect(() => {
    setLocalGap(preferences.gapLimitReceive.toString());
  }, [preferences]);

  const networkChanged = async (selected: string) => {
    const selectedNetwork = selected.toLowerCase() as Network;
    await sendMessage('wallet.switchNetwork', { network: selectedNetwork });
    preferences.activeNetwork = selectedNetwork;
    setPreferences(preferences);
  };

  return (
    <div className="flex flex-col text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Advanced Settings" />

      <main className="flex flex-col self-center mt-10 w-full max-w-[328px]">
        <GasLimitInputField
          label="Gap limit"
          value={localGap}
          explanation="Explanation"
          showReset={true}
          onChange={(e: { target: { value: React.SetStateAction<string> } }) => {
            setLocalGap(e.target.value);
            const parsed = Number(e.target.value);
            if (!isNaN(parsed)) {
              // setGapLimit(parsed);
            }
          }}
          onReset={() => {
            setLocalGap('500');
            // setGapLimit(500);
          }}
        />

        <div className="flex flex-col mt-3 mb-3 w-full font-bold">
          <NetworkSelector
            initialNetwork={displayNetwork}
            options={['Mainnet', 'Testnet']}
            onChange={network => networkChanged(network)}
          />
        </div>

        <div className="flex self-start my-2 h-[1px] w-full bg-background-5f" />

        <div className="flex flex-col w-full justify-center gap-2">
          <button
            className="flex gap-10 justify-between items-start py-2 w-full text-base leading-none text-white"
            onClick={() => navigate('/settings/advanced/xpub')}>
            <span className="text-base font-bold">Get xPub</span>
            <img
              loading="lazy"
              src={chrome.runtime.getURL(`popup/right_arrow_icon.svg`)}
              alt=""
              className="object-contain shrink-0 w-6 aspect-square"
            />
          </button>
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
        </div>
      </main>
    </div>
  );
};
