import type * as React from 'react';

export interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  id: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, type, placeholder, id }) => {
  return (
    <div className="flex flex-col w-full">
      <label htmlFor={id} className="mb-2 text-white text-lg font-extrabold">
        {label}
      </label>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        className="p-3 w-full rounded-2xl border border-solid bg-input border-neutral-700 text-neutral-500 max-sm:p-2.5"
      />
    </div>
  );
};
