import { Button } from '@src/components/Button';

interface TransactionConfirmProps {
  onConfirm?: () => void;
}

export function TransactionConfirm({ onConfirm }: TransactionConfirmProps) {
  return (
    <div className="flex overflow-hidden flex-col p-5 text-lg bg-dark max-w-[375px]">
      <div className="self-center text-xl font-bold leading-none text-center text-white">Confirm transaction</div>
      <div className="flex flex-col mt-14 w-full max-w-[298px]">
        <div className="flex flex-col w-full leading-none">
          <div className="font-medium text-white">Asset Sent</div>
          <div className="flex gap-2 items-center mt-2 w-full text-neutral-500">
            <img
              loading="lazy"
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/3b9b49475d1b0d2badbbc980d1683f223f7a049653d03ef24681b3088be31696?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
              className="object-contain shrink-0 self-stretch my-auto w-8 aspect-square"
              alt="Bitcoin logo"
            />
            <div className="self-stretch my-auto">Bitcoin (BTC)</div>
          </div>
        </div>
        <div className="flex flex-col mt-6 w-full">
          <div className="font-medium leading-none text-white">Receiving address</div>
          <div className="mt-2 leading-6 text-neutral-500">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</div>
        </div>
        <div className="flex flex-col mt-6 w-full leading-none text-neutral-500">
          <div className="font-medium text-white">Amount to send</div>
          <div className="mt-2">0.012 BTC</div>
          <div className="mt-2">120 USD</div>
        </div>
        <div className="flex flex-col mt-6 w-full leading-none text-neutral-500">
          <div className="font-medium text-white">Fee</div>
          <div className="mt-2">0.000012 BTC</div>
          <div className="mt-2">0.52 USD</div>
        </div>
      </div>
      <div className="mt-28">
        <Button onClick={onConfirm}>Confirm & Send</Button>
      </div>
    </div>
  );
}
