import type * as React from 'react';

export interface WordItemProps {
  text: string;
  isHighlighted?: boolean;
  isInput?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

export interface WordColumnProps {
  words: WordItemProps[];
}

export const WordColumn: React.FC<WordColumnProps> = ({ words }) => (
  <div className="flex flex-col justify-between w-[134px]">
    {words.map((item, index) => (
      <div key={index} className={index > 0 ? 'mt-3.5' : ''}>
        <div className="flex flex-col w-full max-w-[131px]">
          {item.isInput ? (
            <input
              type="text"
              value={item.text} // controlled input
              placeholder={item.placeholder || 'Enter word'}
              onChange={e => item.onChange && item.onChange(e.target.value)}
              onPaste={item.onPaste}
              className="gap-3 self-stretch px-1.5 w-full rounded-md min-h-[35px] bg-neutral-400 text-neutral-800 text-center placeholder-[#222222]"
            />
          ) : (
            <div
              className={`gap-3 self-stretch px-1.5 w-full rounded-md min-h-[35px] ${
                item.isHighlighted ? 'bg-neutral-400 text-neutral-800' : 'bg-neutral-700 text-foreground'
              }`}
              tabIndex={0}
              role="button"
              aria-pressed={item.isHighlighted}>
              {item.text}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);
