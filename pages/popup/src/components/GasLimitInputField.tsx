import type * as React from 'react';

export interface GasLimitInputFieldProps {
  label: string;
  explanation?: string;
  value?: string;
  showReset?: boolean;
  onReset?: () => void;
}

export const GasLimitInputField: React.FC<GasLimitInputFieldProps> = ({
  label,
  explanation,
  value,
  showReset,
  onReset,
}) => {
  return (
    <div className="flex flex-col w-full text-xs font-bold leading-6 mb-3">
      <div className="text-base leading-[22px] text-white font-bold">{label}</div>
      {explanation && <div className="text-xs font-normal leading-[22px] text-foreground-e7">{explanation}</div>}
      <input
        type="number"
        placeholder={'0'}
        className="p-3 w-full rounded-2xl border border-solid bg-input border-background-42 text-white max-sm:p-2.5 text-base placeholder:text-base"
        value={value}
      />
      {showReset && (
        <button
          onClick={onReset}
          className="mt-1 flex justify-end gap-0.5 items-center py-1 pr-1 w-full text-primary-yellow">
          <div className="self-stretch my-auto text-xs font-normal">Reset to default</div>
          <img
            loading="lazy"
            src={chrome.runtime.getURL(`popup/refresh_icon.svg`)}
            className="object-contain shrink-0 self-stretch my-auto w-[12px] aspect-square"
            alt=""
          />
        </button>
      )}
    </div>
  );
};
