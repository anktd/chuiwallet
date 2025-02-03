import type * as React from 'react';

export interface NetworkSelectorProps {
  label: string;
  value: string;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ label, value }) => {
  return (
    <div className="flex flex-col justify-center w-full">
      <div className="text-sm leading-loose text-white">{label}</div>
      <div className="flex flex-col w-full text-lg leading-8 whitespace-nowrap text-neutral-500">
        <button className="flex gap-2.5 justify-center items-center px-2.5 py-3 w-full rounded-2xl border border-solid bg-stone-900 border-neutral-700">
          <div className="self-stretch my-auto w-[213px]">{value}</div>
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/089cd0d182a250c79bcf29b22da0eabf89bae1e0403a00851b188c3f01f048d5?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
            className="object-contain shrink-0 self-stretch my-auto w-2.5 aspect-[0.91]"
            alt=""
          />
        </button>
      </div>
    </div>
  );
};
