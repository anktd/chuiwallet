import type * as React from 'react';

export interface AddressInputProps {
  label: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({ label }) => {
  return (
    <div className="flex flex-col w-full">
      <label htmlFor="receiving-address" className="mb-2">
        {label}
      </label>
      <input
        id="receiving-address"
        type="text"
        className="flex gap-2.5 py-3 w-full rounded-2xl border border-solid bg-stone-900 border-neutral-700 min-h-[55px]"
        aria-label={label}
      />
    </div>
  );
};
