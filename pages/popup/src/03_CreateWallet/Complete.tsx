import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useWalletContext } from '@src/context/WalletContext';

export function Complete() {
  const navigate = useNavigate();
  const { setOnboarded } = useWalletContext();

  const handleComplete = () => {
    chrome.storage.local.set({ walletOnboarded: true }, () => {
      console.log('Onboarding complete.');
    });
    setOnboarded(true);

    navigate('/dashboard');
  };

  return (
    <div className="flex overflow-hidden flex-col items-center px-5 pt-24 pb-[19px] bg-dark h-full">
      <div className="flex flex-col flex-1 items-center w-full">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-1 flex-col self-stretch w-full text-center">
            <div className="text-2xl font-bold leading-loose text-white">You've created a wallet</div>
            <div className="mt-3 text-lg leading-none text-foreground">Keep your seed phrase safe.</div>
          </div>
          <div className="flex justify-center items-center w-full gap-[18px]">
            <img
              loading="lazy"
              src={chrome.runtime.getURL('popup/bitcoin_cash_logo.svg')}
              alt="Wallet creation success"
              className="object-contain self-stretch my-auto aspect-square w-[78px]"
            />
            <img
              loading="lazy"
              src={chrome.runtime.getURL('popup/bitcoin_logo.svg')}
              alt="Wallet creation success"
              className="object-contain self-stretch my-auto aspect-square w-[78px]"
            />
            <img
              loading="lazy"
              src={chrome.runtime.getURL('popup/tether_usd_logo.svg')}
              alt="Wallet creation success"
              className="object-contain self-stretch my-auto aspect-square w-[78px]"
            />
          </div>
          <div className="text-lg leading-6 text-center text-foreground">
            Remember we can't recover
            <br />
            your seed phrase for you.
          </div>
        </div>
        <div className="flex items-end flex-1 w-full">
          <Button onClick={handleComplete}>Go to dashboard</Button>
        </div>
      </div>
    </div>
  );
}
