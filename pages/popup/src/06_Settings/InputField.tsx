import type * as React from 'react';

export interface InputFieldProps {
  label: string;
  explanation?: string;
  value: string;
  showReset?: boolean;
  onReset?: () => void;
}

export const InputField: React.FC<InputFieldProps> = ({ label, explanation, value, showReset, onReset }) => {
  return (
    <div className="flex flex-col w-full text-xs font-bold leading-6">
      <div className="text-base leading-none text-white">{label}</div>
      {explanation && <div className="text-neutral-200">{explanation}</div>}
      <div className="flex flex-col w-full text-lg leading-8 whitespace-nowrap text-neutral-500">
        <div className="gap-2.5 self-stretch px-2.5 py-3 w-full rounded-2xl border border-solid bg-stone-900 border-neutral-700">
          {value}
        </div>
      </div>
      {showReset && (
        <button onClick={onReset} className="flex gap-0.5 items-center py-0.5 pr-0.5 w-full text-yellow-300">
          <div className="self-stretch my-auto">Reset to default</div>
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/6310cb4a5dc1bbee9bdb8648a31d7f33ff93da5374eab207dbdb0a48cc44de2f?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
            className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
            alt=""
          />
        </button>
      )}
    </div>
  );
};
