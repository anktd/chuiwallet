import * as React from 'react';
import { InputField } from './InputField';
import { TermsCheckbox } from './TermsCheckbox';

export const PasswordSetup: React.FC = () => {
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex overflow-hidden flex-col px-5 pt-12 pb-7 min-h-screen bg-neutral-900 w-[375px] max-md:px-6 max-md:py-10 max-sm:px-4 max-sm:py-8">
      <div className="flex flex-col w-full">
        <div className="flex flex-col items-center self-center max-w-full text-center w-[262px]">
          <h1 className="w-full text-2xl font-bold leading-loose text-left text-white max-sm:text-2xl">
            Set up a password
          </h1>
          <div className="mt-3 w-full text-lg leading-6 text-left text-neutral-400 max-sm:text-base">
            <span>It will be used to access Chui</span>
            <br />
            <span>on this browser</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col mt-6 w-full text-lg font-bold leading-8">
          <InputField label="Password" type="password" placeholder="Password" id="password" />
          <InputField label="Confirm password" type="password" placeholder="Confirm password" id="confirmPassword" />
          <TermsCheckbox onAcceptChange={setTermsAccepted} />
          <button
            type="submit"
            disabled={!termsAccepted}
            className="p-3 mt-44 w-full text-lg font-bold bg-yellow-300 rounded-2xl cursor-pointer border-[none] text-neutral-700 max-md:mt-36 max-sm:mt-32 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
        </form>
      </div>
    </div>
  );
};
