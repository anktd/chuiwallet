import type * as React from 'react';

export interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  id: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, type, placeholder, id }) => {
  return (
    <div className="flex flex-col mb-3 w-full">
      <label htmlFor={id} className="mb-2 text-white text-lg font-bold">
        {label}
      </label>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        className="p-3 w-full text-lg rounded-2xl border border-solid bg-stone-900 border-neutral-700 text-neutral-500 max-sm:p-2.5 max-sm:text-base"
      />
    </div>
  );
};
