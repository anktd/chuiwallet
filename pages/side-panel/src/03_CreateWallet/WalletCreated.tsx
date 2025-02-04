import { Button } from '../components/Button';

export function WalletCreated() {
  const handleDashboardClick = () => {
    // Handle dashboard navigation
  };

  return (
    <div className="flex overflow-hidden flex-col px-5 pt-24 pb-7 bg-dark max-w-[375px]">
      <div className="flex flex-col items-center self-center w-full max-w-[310px]">
        <div className="flex flex-col self-stretch w-full text-center">
          <div className="text-2xl font-bold leading-loose text-white">You've created a wallet</div>
          <div className="mt-3 text-lg leading-none text-neutral-400">Keep your seed phrase safe.</div>
        </div>
        <div className="flex gap-6 justify-center items-center mt-6 w-[78px]">
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/c25324e7d5513018ecd63f59bc63a5fdac06538dc159dff335e62994023880b0?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
            alt="Wallet creation success"
            className="object-contain self-stretch my-auto aspect-square w-[78px]"
          />
        </div>
        <div className="mt-6 text-lg leading-6 text-center text-neutral-400">
          Remember we can't recover your seed phrase for you.
        </div>
        <Button onClick={handleDashboardClick}>Go to dashboard</Button>
      </div>
    </div>
  );
}
