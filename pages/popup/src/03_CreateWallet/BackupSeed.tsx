import type * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { SeedColumn } from '../components/SeedColumn';

export const BackupSeed: React.FC = () => {
  const navigate = useNavigate();
  const leftColumnWords = ['umbrella', 'tree', 'lettuce', 'plasma', 'lore', 'trouble'];
  const rightColumnWords = ['bicycle', 'classes', 'riots', 'care', 'father', 'perfect'];

  return (
    <div className="flex overflow-hidden flex-col items-center px-5 pt-12 pb-7 bg-dark h-full">
      <div className="flex flex-col justify-between self-stretch w-full text-center min-h-[388px]">
        <div className="flex flex-col w-full">
          <div className="text-2xl font-bold leading-loose text-white">Back up your seed phrase</div>
          <div className="mt-1 text-lg leading-none text-neutral-400">Write it down and keep it safe.</div>
        </div>
        <div className="flex gap-4 self-center mt-6 text-base leading-9 whitespace-nowrap min-h-[284px] text-neutral-400">
          <SeedColumn words={leftColumnWords} />
          <SeedColumn words={rightColumnWords} />
        </div>
      </div>
      <button
        className="gap-2.5 self-stretch px-2.5 py-3 mt-5 text-lg font-bold leading-8 text-yellow-300 whitespace-nowrap rounded-2xl"
        tabIndex={0}
        onClick={() => {
          navigate('/onboard/complete');
        }}>
        Skip
      </button>
      <button
        className="gap-2.5 self-stretch px-2.5 py-3 mt-1.5 text-lg font-bold leading-8 bg-yellow-300 rounded-2xl text-neutral-900"
        tabIndex={0}
        onClick={() => {
          navigate('/onboard/verify-seed');
        }}>
        Verify seed
      </button>
    </div>
  );
};
