// pages/popup/src/03_CreateWallet/VerifySeed.tsx
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WordColumn } from '../components/WordColumn';
import { Button } from '@src/components/Button';
import { useWalletContext } from '../context/WalletContext';

export const VerifySeed: React.FC = () => {
  const navigate = useNavigate();
  const { wallet, password } = useWalletContext();
  const [seedWords, setSeedWords] = useState<string[]>([]);
  const [missingPositions, setMissingPositions] = useState<number[]>([]);
  const [userInputs, setUserInputs] = useState<{ [pos: number]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const positions = pickRandomPositions(3, 12);
    setMissingPositions(positions);

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
      setSeedWords(seed.split(' '));
    } catch (err) {
      console.error('Error recovering seed in verify:', err);
    }
    setLoading(false);
  }, [wallet, password]);

  const handleChange = (pos: number, value: string) => {
    setUserInputs(prev => ({ ...prev, [pos]: value }));
  };

  const handleVerify = () => {
    let valid = true;
    for (const pos of missingPositions) {
      const actual = seedWords[pos - 1]?.trim();
      const userVal = userInputs[pos]?.trim();
      if (actual !== userVal) {
        valid = false;
        break;
      }
    }
    if (valid) {
      alert('Seed verified successfully!');
      navigate('/onboard/complete');
    } else {
      alert('Seed verification failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-dark">
        <p className="text-white">Loading seed for verification...</p>
      </div>
    );
  }

  // Transform seed words into two columns.
  const leftWords = seedWords.slice(0, 6).map((word, i) => {
    const pos = i + 1;
    if (missingPositions.includes(pos)) {
      return { text: '', isHighlighted: true };
    }
    return { text: word, isHighlighted: false };
  });
  const rightWords = seedWords.slice(6, 12).map((word, i) => {
    const pos = i + 7;
    if (missingPositions.includes(pos)) {
      return { text: '', isHighlighted: true };
    }
    return { text: word, isHighlighted: false };
  });

  return (
    <div className="flex overflow-hidden flex-col px-5 pt-12 pb-[19px] bg-dark h-full w-full">
      <div className="flex flex-col self-center w-full text-center">
        <div className="flex flex-col w-full">
          <div className="text-2xl font-bold leading-loose text-white">Verify words</div>
          <div className="mt-3 text-lg leading-6 text-foreground">
            Rewrite the correct words on the empty fields to verify your wallet
          </div>
        </div>
        <div className="flex gap-4 self-center mt-6 text-base leading-9 whitespace-nowrap min-h-[289px] text-foreground">
          <WordColumn
            words={leftWords.map((item, i) => ({
              ...item,
              onChange: missingPositions.includes(i + 1) ? (val: string) => handleChange(i + 1, val) : undefined,
            }))}
          />
          <WordColumn
            words={rightWords.map((item, i) => ({
              ...item,
              onChange: missingPositions.includes(i + 7) ? (val: string) => handleChange(i + 7, val) : undefined,
            }))}
          />
        </div>
      </div>
      <Button className="mt-12 w-full" onClick={handleVerify}>
        Continue
      </Button>
    </div>
  );
};

/** Helper: Pick N distinct random positions from 1 to total */
function pickRandomPositions(n: number, total: number): number[] {
  const positions: number[] = [];
  while (positions.length < n) {
    const pos = Math.floor(Math.random() * total) + 1;
    if (!positions.includes(pos)) {
      positions.push(pos);
    }
  }
  return positions.sort((a, b) => a - b);
}
