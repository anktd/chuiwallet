import { Button } from '@src/components/Button';
import type * as React from 'react';

export const TransactionComplete: React.FC = () => {
  const handleDashboardClick = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex overflow-hidden flex-col items-center px-5 pt-40 pb-5 bg-dark]">
      <div className="flex flex-col items-center w-[54px]">
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/fd1c8a107c3bfb1aa40a1e08fa4c14b00779c9bc93d453f18b12d88b81334d35?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
          alt="Bitcoin transaction status icon"
          className="object-contain aspect-[1.3] w-[26px]"
        />
      </div>
      <div className="mt-8 text-2xl font-bold leading-none text-center text-white">Bitcoin Sent</div>
      <div className="mt-5 text-lg leading-none text-center text-zinc-600">
        See the state of <span className="text-yellow-300">your transaction</span>
      </div>
      <div className="mt-12 text-sm font-bold leading-none text-center text-white">Transaction ID</div>
      <div className="text-sm font-bold leading-5 text-center text-foreground">
        cb00b56c1de3e81cb3d647ed81946eb1b1c7e8f0191ad09d85175d592b59b0a5
      </div>
      <Button onClick={handleDashboardClick}>Go to dashboard</Button>
    </div>
  );
};
