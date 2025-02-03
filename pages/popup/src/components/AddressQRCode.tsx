import type * as React from 'react';

interface AddressSectionProps {
  bitcoinAddress: string;
}

const AddressQRCode: React.FC<AddressSectionProps> = ({ bitcoinAddress }) => {
  return (
    <div className="flex flex-col items-center px-20 mt-10 w-full">
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/608ff69817e3f0a577b8d3c148e0cb25500b75d07b746c641a4f901133ba5c4d?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt="Bitcoin logo"
        className="object-contain w-12 aspect-square"
      />
      <div className="mt-8 text-2xl font-bold leading-none text-center">Bitcoin address</div>
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/659d40f753971dfb1f9c4d1c25d826432dacc6657907274ee840604020984b83?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt="QR code for the Bitcoin address"
        className="object-contain mt-8 max-w-full aspect-square w-[168px]"
      />
      <div className="self-start mt-8 text-lg leading-5 text-center whitespace-nowrap">{bitcoinAddress}</div>
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/b463c6a32268dbcebe46c0ef0464c6a5523732c89502697f23093ee277ada1d1?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt=""
        className="object-contain z-10 self-end -mt-4 w-3 aspect-square"
      />
      <div className="flex gap-0.5 justify-center items-center py-0.5 pr-0.5 mt-12 text-xs leading-6 text-yellow-300">
        <div className="self-stretch my-auto">Get a new address</div>
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/1ef18f66fe868fcf10451afb015f26e02ac9457699b984c00c9ff1cb1c30fc25?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
          alt=""
          className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
        />
      </div>
    </div>
  );
};

export default AddressQRCode;
