import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeedColumn } from '../components/SeedColumn';
import { Button } from '@src/components/Button';
import { useWalletContext } from '../context/WalletContext';

export const BackupSeed: React.FC = () => {
  const navigate = useNavigate();
  const { wallet, password } = useWalletContext();
  const [leftColumnWords, setLeftColumnWords] = useState<string[]>([]);
  const [rightColumnWords, setRightColumnWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-dark">
        <p className="text-white">Loading your seed phrase...</p>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden flex-col items-center px-5 pt-12 pb-[19px] bg-dark h-full w-full">
      <div className="flex flex-col justify-between self-stretch w-full text-center min-h-[388px]">
        <div className="flex flex-col w-full">
          <div className="text-2xl font-bold leading-loose text-white">Back up your seed phrase</div>
          <div className="mt-1 text-lg leading-none text-foreground">Write it down and keep it safe.</div>
        </div>
        <div className="flex gap-4 self-center mt-6 text-base leading-9 whitespace-nowrap min-h-[292px] text-foreground">
          <SeedColumn words={leftColumnWords} />
          <SeedColumn words={rightColumnWords} />
        </div>
      </div>
      <button
        className="gap-2.5 self-stretch px-2.5 py-3 mt-6 text-lg font-bold leading-8 text-yellow-300 whitespace-nowrap rounded-2xl"
        tabIndex={0}
        onClick={() => navigate('/onboard/complete')}>
        Skip
      </button>
      <Button tabIndex={0} onClick={() => navigate('/onboard/verify-seed')}>
        Verify seed
      </Button>
    </div>
  );
};
