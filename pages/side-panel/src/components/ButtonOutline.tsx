import type * as React from 'react';

export interface ButtonOutlineProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ButtonOutline: React.FC<ButtonOutlineProps> = ({ children, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`gap-2.5 self-stretch px-2.5 py-3 mt-80 w-full text-lg font-bold leading-8 text-yellow-300 rounded-2xl border border-yellow-300 border-solid max-w-[338px] ${className}`}
      tabIndex={0}>
      {children}
    </button>
  );
};
