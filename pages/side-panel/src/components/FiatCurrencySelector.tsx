import { useWalletContext } from '@src/context/WalletContext';
import type { StoredAccount } from '@src/types';
import type React from 'react';
import { useState, useRef, useEffect } from 'react';

type FiatCurrencySelectorProps = {
  options?: 'USD' | 'BTC'[];
  onSelect?: (currency: 'USD' | 'BTC') => void;
};

const FiatCurrencySelector: React.FC<FiatCurrencySelectorProps> = ({ options, onSelect }) => {
  const { selectedFiatCurrency, setSelectedFiatCurrency } = useWalletContext();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (selected: 'USD' | 'BTC') => {
    setSelectedFiatCurrency(selected);
    setIsOpen(false);
    if (onSelect) {
      onSelect(selected);
    }

    chrome.storage.local.get(['storedAccount'], res => {
      const storedAccount: StoredAccount | undefined = res.storedAccount;
      if (storedAccount) {
        storedAccount.fiatCurrency = selected;
        chrome.storage.local.set({ storedAccount });
      }
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col justify-center w-full gap-[2px]" ref={containerRef}>
      <div className="text-base leading-[22px] text-white font-bold">Fiat currency</div>
      <div className="text-xs leading-[22px] text-foreground-e1">Choose the global fiat currency</div>
      <div className="flex flex-col w-full text-lg leading-8 whitespace-nowrap text-foreground-79">
        <button
          type="button"
          onClick={toggleDropdown}
          className="flex gap-2.5 justify-center items-center px-10 py-3 w-full rounded-2xl bg-background-1d border border-background-42">
          <span className="self-stretch my-auto w-full text-left text-foregrouund1 font-bold text-lg">
            {selectedFiatCurrency}
          </span>
          <img
            loading="lazy"
            src={chrome.runtime.getURL('popup/dropdown_arrow_icon.svg')}
            alt="Dropdown arrow"
            className="object-contain shrink-0 self-stretch my-auto w-2.5 aspect-[0.91]"
          />
        </button>
        {isOpen && (
          <div className="absolute flex flex-col z-10 mt-[60px] w-full bg-background-1d border border-background-42 rounded-2xl">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className="self-stretch my-auto w-full text-left text-foregrouund1 hover:bg-background-42 font-bold text-lg px-[44px] py-2 rounded-lg">
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FiatCurrencySelector;
