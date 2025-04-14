import type * as React from 'react';

export interface AddressInputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  id: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onQRClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const AddressInputField: React.FC<AddressInputFieldProps> = ({
  label,
  type,
  placeholder,
  id,
  value,
  onChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onQRClick,
  onKeyDown,
}) => {
  return (
    <div className="flex flex-col w-full">
      <label htmlFor={id} className="mb-2 text-white text-lg font-extrabold">
        {label}
      </label>
      <div className="relative w-full">
        <input
          type={type}
          id={id}
          placeholder={placeholder}
          className="p-3 w-full rounded-2xl border border-solid bg-input border-background-42 text-foreground-79 max-sm:p-2.5"
          style={{ paddingRight: '40px' }}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        {/* <button onClick={onQRClick} className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <img loading="lazy" src={chrome.runtime.getURL('popup/qrcode_icon.svg')} alt="QR Code" className="w-6 h-6" />
        </button> */}
      </div>
    </div>
  );
};
