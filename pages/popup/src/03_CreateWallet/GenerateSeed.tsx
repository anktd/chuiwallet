import type * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@src/components/Button';

export const GenerateSeed: React.FC = () => {
  const navigate = useNavigate();
  const infoLines = ['Back up your wallet.', 'Never lose it.', 'Never share it with anyone.'];

  return (
    <div className="relativeflex h-full w-full overflow-hidden flex-col px-5 pt-48 pb-[19px] bg-dark">
      <div className="flex flex-col justify-between items-center w-full flex-1">
        <div className="flex flex-col max-w-[262px]">
          <div className="text-2xl font-extrabold leading-10 text-center text-white">
            We will generate a seed phrase for you
          </div>
          <ul className="mt-6 text-lg leading-6 pl-6 text-foreground list-disc">
            {infoLines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
        <Button className="absolute w-full bottom-[19px]" onClick={() => navigate('/onboard/backup-seed')}>
          Reveal seed phrase
        </Button>
      </div>
    </div>
  );
};
