import type * as React from 'react';

export const TestnetBanner: React.FC = () => {
  return (
    <div className="z-[100] fixed bottom-0 w-full h-[33px] bg-[#A82E26] text-white text-[16px] flex items-center justify-center text-light">
      This is a test network. Coins have no value.
    </div>
  );
};
