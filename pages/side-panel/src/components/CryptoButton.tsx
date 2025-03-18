import type * as React from 'react';

export interface CryptoButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
}

export const CryptoButton: React.FC<CryptoButtonProps> = ({ icon, label, onClick }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      className="flex gap-2.5 justify-center items-center self-stretch px-2.5 py-3.5 my-auto rounded-2xl border border-solid bg-zinc-800 border-stone-900 min-h-[50px] min-w-[160px] w-full">
      <div className="flex flex-1 shrink gap-2 justify-center items-center self-stretch my-auto w-full basis-0">
        <img
          loading="lazy"
          src={chrome.runtime.getURL(icon)}
          alt={`${label} icon`}
          className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
        />
        <div className="self-stretch my-auto">{label}</div>
      </div>
    </div>
  );
};
