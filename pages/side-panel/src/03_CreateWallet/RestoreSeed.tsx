import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bip39 from 'bip39';
import { WordColumn } from '../components/WordColumn';
import { Button } from '@src/components/Button';
import { useWalletContext } from '../context/WalletContext';

export const RestoreSeed: React.FC = () => {
  const navigate = useNavigate();
  const { restoreWallet, password } = useWalletContext();

  const [seedWords, setSeedWords] = useState<string[]>(Array(12).fill(''));
  const [errorMsg, setErrorMsg] = React.useState('');
  const [isValid, setIsValid] = useState(false);

  const wordValidity = useMemo(() => {
    return seedWords.map(word => {
      const trimmed = word.trim().toLowerCase();
      return trimmed !== '' && bip39.wordlists.english.includes(trimmed);
    });
  }, [seedWords]);

  useEffect(() => {
    const allWordsValid = wordValidity.every(valid => valid);
    const mnemonic = seedWords.join(' ').trim();
    const mnemonicValid = allWordsValid && bip39.validateMnemonic(mnemonic);
    setIsValid(mnemonicValid);
  }, [seedWords, wordValidity]);

  const handleChange = (pos: number, value: string) => {
    setSeedWords(prev => {
      const updated = [...prev];
      updated[pos - 1] = value.trim();
      return updated;
    });
  };

  const handleContainerPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const pasteData = e.clipboardData.getData('Text').trim();
    const splitWords = pasteData.split(/\s+/);
    if (splitWords.length === 12) {
      e.preventDefault();
      setSeedWords(splitWords);
    }
  };

  const handleRestore = () => {
    setErrorMsg('');

    if (!isValid) {
      setErrorMsg('Seed phrase is invalid. Please check each word.');
      return;
    }

    for (let i = 0; i < 12; i++) {
      if (!seedWords[i] || seedWords[i].trim() === '') {
        setErrorMsg('Please fill in all 12 words.');
        return;
      }
    }

    const mnemonic = seedWords.join(' ').trim();

    if (!password) {
      setErrorMsg('No universal password found. Please unlock your wallet first.');
      return;
    }

    restoreWallet(mnemonic, password, 'mainnet', 'bech32');

    navigate('/onboard/complete');
  };

  const leftWords = seedWords.slice(0, 6).map((word, i) => ({
    text: word,
    isInput: true,
    onChange: (val: string) => handleChange(i + 1, val),
    placeholder: `${i + 1}.`,
    isValid: wordValidity[i],
  }));

  const rightWords = seedWords.slice(6, 12).map((word, i) => ({
    text: word,
    isInput: true,
    onChange: (val: string) => handleChange(i + 7, val),
    placeholder: `${i + 7}.`,
    isValid: wordValidity[i + 6],
  }));

  return (
    <div
      className="relative flex overflow-hidden flex-col px-5 pt-12 pb-[19px] bg-dark h-full w-full"
      onPaste={handleContainerPaste}>
      <div className="flex flex-col self-center w-full text-center max-w-[600px] mx-auto">
        <div className="flex flex-col w-full">
          <div className="text-2xl font-bold leading-loose text-white">Input your seed phrase</div>
          <div className="mt-3 text-lg leading-6 text-foreground">
            Rewrite the correct words on the empty fields to open your wallet
          </div>
        </div>

        <div className="flex gap-4 self-center mt-6 text-base leading-9 whitespace-nowrap min-h-[289px] text-foreground">
          <WordColumn words={leftWords} />
          <WordColumn words={rightWords} />
        </div>
      </div>

      <span className="mt-6 text-xs text-primary-red font-light text-center">{errorMsg}</span>

      <Button className="absolute bottom-[19px]" disabled={!isValid} onClick={handleRestore}>
        Continue
      </Button>
    </div>
  );
};
