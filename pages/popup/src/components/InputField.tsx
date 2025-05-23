import type * as React from 'react';

export interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  id: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const InputField: React.FC<InputFieldProps> = ({ label, type, placeholder, id, value, onChange, onKeyDown }) => {
  return (
    <div className="flex flex-col w-full">
      <label htmlFor={id} className="mb-2 text-white text-lg font-extrabold">
        {label}
      </label>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        className="p-3 w-full rounded-2xl border border-solid bg-input border-background-42 text-foreground-79 max-sm:p-2.5"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};
