import type * as React from 'react';

export interface WordItemProps {
  text: string;
  isHighlighted?: boolean;
}

export interface WordColumnProps {
  words: WordItemProps[];
}

export const WordColumn: React.FC<WordColumnProps> = ({ words }) => (
  <div className="flex flex-col justify-between w-[134px]">
    {words.map((word, index) => (
      <div key={index} className={index > 0 ? 'mt-3.5' : ''}>
        <div className="flex flex-col w-full max-w-[131px]">
          <div
            className={`gap-3 self-stretch px-1.5 w-full rounded-md min-h-[35px] ${
              word.isHighlighted ? 'bg-neutral-400 text-neutral-800' : 'bg-neutral-700 text-foreground'
            }`}
            tabIndex={0}
            role="button"
            aria-pressed={word.isHighlighted}>
            {word.text}
          </div>
        </div>
      </div>
    ))}
  </div>
);
