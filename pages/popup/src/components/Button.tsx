import type * as React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tabIndex?: number;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, disabled, tabIndex, className }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-[55px] w-full max-w-[343px] p-3 text-lg font-bold bg-primary-yellow rounded-2xl cursor-pointer border-none text-dark disabled:bg-background-79 disabled:text-foreground-42 disabled:cursor-not-allowed ${className}`}
      tabIndex={tabIndex}>
      {children}
    </button>
  );
};
