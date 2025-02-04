import type * as React from 'react';
import { useNavigate } from 'react-router-dom';

export const GenerateSeed: React.FC = () => {
  const navigate = useNavigate();
  const infoLines = ['Back up your wallet.', 'Never lose it.', 'Never share it with anyone.'];

  return (
    <div className="flex h-screen overflow-hidden flex-col px-5 pt-48 pb-7 bg-dark">
      <div className="flex flex-col justify-between items-center w-full flex-1">
        <div className="flex flex-col max-w-[262px]">
          <div className="text-2xl font-extrabold leading-10 text-center text-white">
            We will generate a
            <br />
            seed phrase for you
          </div>
          <ul className="mt-6 text-lg leading-6 pl-6 text-neutral-400 list-disc">
            {infoLines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => {
            navigate('/onboard/backup-seed');
          }}
          className="p-3 w-full text-lg font-bold bg-primary-yellow rounded-2xl cursor-pointer border-none text-dark disabled:bg-disabledBg disabled:text-disabledText disabled:cursor-not-allowed">
          Reveal seed phrase
        </button>
      </div>
    </div>
  );
};
