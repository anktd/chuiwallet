import type * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { WordColumn } from '../components/WordColumn';

const leftColumnWords = [
  { text: 'umbrella' },
  { text: 'tree', isHighlighted: true },
  { text: 'lettuce' },
  { text: 'plasma' },
  { text: 'lore', isHighlighted: true },
  { text: 'trouble' },
];

const rightColumnWords = [
  { text: 'bicycle' },
  { text: 'classes' },
  { text: 'riots' },
  { text: 'care', isHighlighted: true },
  { text: 'father' },
  { text: 'perfect' },
];

export const VerifySeed: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex overflow-hidden flex-col px-5 pt-12 pb-7 bg-dark max-w-[375px]">
      <div className="flex flex-col self-center w-full text-center max-w-[304px]">
        <div className="flex flex-col w-full">
          <div className="text-2xl font-bold leading-loose text-white">Verify words</div>
          <div className="mt-3 text-lg leading-6 text-neutral-400">
            Rewrite the correct words on <br />
            the empty fields to verify your wallet
          </div>
        </div>
        <div className="flex gap-4 self-center mt-6 text-base leading-9 whitespace-nowrap min-h-[284px] text-neutral-400">
          <WordColumn words={leftColumnWords} />
          <WordColumn words={rightColumnWords} />
        </div>
      </div>
      <button
        className="gap-2.5 self-stretch px-2.5 py-3 mt-28 text-lg font-bold leading-8 whitespace-nowrap bg-yellow-300 rounded-2xl text-neutral-900"
        onClick={() => {
          navigate('/onboard/complete');
        }}>
        Continue
      </button>
    </div>
  );
};
