import type * as React from 'react';
import { Button } from '../components/Button';
import { InfoText } from '../components/InfoText';

export const SeedPhrase: React.FC = () => {
  const infoLines = ['Back up your wallet.', 'Never lose it.', 'Never share it with anyone.'];

  return (
    <div className="flex overflow-hidden flex-col px-5 pt-48 pb-7 bg-neutral-900 max-w-[375px]">
      <div className="flex flex-col self-center w-full max-w-[262px]">
        <div className="text-2xl font-bold leading-10 text-center text-white">
          We will generate a seed phrase for you
        </div>
        <InfoText lines={infoLines} />
      </div>
      <Button className="mt-52">Reveal seed phrase</Button>
    </div>
  );
};
