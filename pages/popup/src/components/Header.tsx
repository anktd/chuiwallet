import type * as React from 'react';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <div className="flex gap-5 justify-between items-center p-3 text-xl leading-none text-center whitespace-nowrap bg-neutral-900 min-h-[48px]">
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/b5a39d6661db2a04e57b951b545b85a0b950f70cdc6b2049e8c89734c1113975?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt=""
        className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
      />
      <div className="self-stretch w-[262px]">{title}</div>
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/9d247e5775b1c1b7cc45b31b67dc3c6052e5cd94ee61c3666c3b2d726368a36b?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        alt=""
        className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
      />
    </div>
  );
};

export default Header;
