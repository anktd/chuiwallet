import type * as React from 'react';

export interface TermsCheckboxProps {
  onAcceptChange: (accepted: boolean) => void;
}

export const TermsCheckbox: React.FC<TermsCheckboxProps> = ({ onAcceptChange }) => {
  return (
    <div className="flex gap-3 items-center mt-3 w-full text-xs leading-6">
      <div className="flex gap-2 items-center">
        <input
          type="checkbox"
          id="terms"
          onChange={e => onAcceptChange(e.target.checked)}
          className="shrink-0 w-6 h-6 rounded border border-solid bg-stone-900 border-neutral-700"
        />
        <label htmlFor="terms" className="flex gap-1 items-center">
          <span className="text-white">I accept the</span>
          <a href="/terms" className="text-yellow-300 no-underline">
            Terms of Service
          </a>
        </label>
      </div>
    </div>
  );
};
