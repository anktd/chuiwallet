import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeedColumn } from '../components/SeedColumn';
import { Button } from '@src/components/Button';
import { useWalletContext } from '../context/WalletContext';
import Header from '@src/components/Header';

export const RevealSeed: React.FC = () => {
  const navigate = useNavigate();
  const { wallet, password } = useWalletContext();
  const [leftColumnWords, setLeftColumnWords] = useState<string[]>([]);
  const [rightColumnWords, setRightColumnWords] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!wallet || !password) {
      console.error('Wallet or password not available in context');
      setLoading(false);
      return;
    }
    try {
      const seed = wallet.recoverMnemonic(password);
      if (!seed) {
        console.error('Failed to recover seed');
        setLoading(false);
        return;
      }
      const words = seed.split(' ');
      if (words.length !== 12) {
        console.error('Expected 12 words, got', words.length);
      }
      setLeftColumnWords(words.slice(0, 6));
      setRightColumnWords(words.slice(6, 12));
    } catch (err) {
      console.error('Error recovering seed:', err);
    }
    setLoading(false);
  }, [wallet, password]);

  const handleCopyToClipboard = async () => {
    try {
      if (!wallet || !password) {
        console.error('Wallet or password not available in context');
        return;
      }
      const seed = wallet.recoverMnemonic(password);
      if (!seed) {
        console.error('Failed to recover seed');
        return;
      }
      await navigator.clipboard.writeText(seed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy seed:', err);
    }
  };

  return (
    <div className="flex flex-col text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Seed phrase" hideClose={true} />
      <div className="mt-[60px] flex flex-col self-stretch w-full text-center min-h-[360px] px-[37.5px] gap-[24px]">
        <div className="flex flex-col w-full">
          <div className="mt-1 text-lg leading-[25px] text-foreground">Write it down and keep it safe.</div>
        </div>
        <div className="flex gap-4 self-center text-base leading-9 whitespace-nowrap min-h-[292px] text-foreground">
          <SeedColumn words={leftColumnWords} />
          <SeedColumn words={rightColumnWords} />
        </div>
      </div>
      <div className="w-full flex justify-center">
        <button
          className="relative text-xs font-bold leading-5 text-yellow-300 whitespace-nowrap rounded-2xl flex gap-1"
          tabIndex={0}
          onClick={handleCopyToClipboard}>
          <span>Copy</span>
          <img src={chrome.runtime.getURL('popup/copy_yellow_icon.svg')} alt="Copy" />
          {copied && (
            <div className="absolute ml-1 mt-[-2px] top-0 left-full p-1 bg-body font-normal bg-neutral-700 text-foreground text-xs rounded z-[1]">
              Copied!
            </div>
          )}
        </button>
      </div>
      <Button className="mt-[40px]" tabIndex={0} onClick={() => navigate('/dashboard')}>
        Hide
      </Button>
    </div>
  );
};

export default RevealSeed;
