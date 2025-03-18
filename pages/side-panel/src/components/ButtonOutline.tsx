import type * as React from 'react';

export interface ButtonOutlineProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const ButtonOutline: React.FC<ButtonOutlineProps> = ({ children, onClick, className, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`gap-2.5 self-stretch left-4 right-4 py-3 text-lg font-bold leading-8 text-primary-yellow rounded-2xl border border-yellow-300 border-solid max-w-[600px] mx-auto ${className}`}
      tabIndex={0}>
      {children}
    </button>
  );
};
