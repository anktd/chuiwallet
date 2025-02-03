import type * as React from 'react';

export interface CurrencyInputProps {
  label: string;
  value: string;
  hasIcon?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ label, value, hasIcon }) => {
  return (
    <div className="flex flex-col grow w-[150px]">
      <div>{label}</div>
      <div className="flex gap-2.5 justify-center items-center px-2.5 py-3 w-full rounded-2xl border border-solid bg-stone-900 border-neutral-700">
        <div className="flex-1 shrink self-stretch my-auto basis-0">{value}</div>
        {hasIcon && (
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/3b9b49475d1b0d2badbbc980d1683f223f7a049653d03ef24681b3088be31696?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
            className="object-contain shrink-0 self-stretch my-auto w-8 aspect-square"
            alt=""
          />
        )}
      </div>
    </div>
  );
};
