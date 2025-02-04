import type * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { WordColumn } from '../components/WordColumn';
import { Button } from '@src/components/Button';

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
    <div className="flex overflow-hidden flex-col px-5 pt-12 pb-[19px] bg-dark h-full w-full">
      <div className="flex flex-col self-center w-full text-center">
        <div className="flex flex-col w-full">
          <div className="text-2xl font-bold leading-loose text-white">Verify words</div>
          <div className="mt-3 text-lg leading-6 text-foreground">
            Rewrite the correct words on <br />
            the empty fields to verify your wallet
          </div>
        </div>
        <div className="flex gap-4 self-center mt-6 text-base leading-9 whitespace-nowrap min-h-[289px] text-foreground">
          <WordColumn words={leftColumnWords} />
          <WordColumn words={rightColumnWords} />
        </div>
      </div>
      <Button
        className="mt-12 w-full"
        onClick={() => {
          navigate('/onboard/complete');
        }}>
        Continue
      </Button>
    </div>
  );
};
