import type * as React from 'react';

export interface AmountInputFieldProps {
  label: string;
  placeholder: string;
  id: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hasIcon: boolean;
  currency?: string;
  disabled?: boolean;
}

export const AmountInputField: React.FC<AmountInputFieldProps> = ({
  label,
  placeholder,
  id,
  value,
  onChange,
  hasIcon,
  currency,
  disabled,
}) => {
  return (
    <div className="flex flex-col w-full">
      <label htmlFor={id} className="text-white text-lg font-extrabold mb-0.5">
        {label}
      </label>
      <div className="relative w-full">
        <input
          type="number"
          id={id}
          placeholder={placeholder}
          className="p-3 w-full rounded-2xl border border-solid bg-input border-background-42 text-foreground-79 max-sm:p-2.5"
          style={{ paddingRight: '40px' }}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
        {hasIcon && (
          <img
            loading="lazy"
            src={chrome.runtime.getURL(`popup/${currency}_coin.svg`)}
            alt="coin"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-[18px]"
          />
        )}
      </div>
    </div>
  );
};
