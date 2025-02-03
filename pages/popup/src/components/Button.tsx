import type * as React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`gap-2.5 self-stretch px-2.5 py-3 text-lg font-bold leading-8 bg-yellow-300 rounded-2xl text-neutral-900 ${className}`}
      tabIndex={0}>
      {children}
    </button>
  );
};
