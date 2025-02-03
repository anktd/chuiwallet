import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { InputField } from '../components/InputField';
import { TermsCheckbox } from '../components/TermsCheckbox';

export const PasswordSetup: React.FC = () => {
  const navigate = useNavigate();
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    navigate('/backup-seed');
  };

  return (
    <div className="flex flex-col h-screen px-5 pt-12 pb-7 bg-neutral-900 max-md:px-6 max-md:py-10 max-sm:px-4 max-sm:py-8">
      <div className="flex flex-col flex-1">
        <div className="flex flex-col items-center self-center max-w-full text-center w-full">
          <h1 className="w-full text-2xl font-bold leading-loose text-white max-sm:text-2xl">Set up a password</h1>
          <div className="mt-3 w-full text-lg leading-6 text-neutral-400 max-sm:text-base">
            <span>It will be used to access Chui</span>
            <br />
            <span>on this browser</span>
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-between mt-6 w-full flex-1 text-lg font-bold leading-8 gap-3">
          <div className="flex flex-col justify-start gap-3">
            <InputField label="Password" type="password" placeholder="Password" id="password" />
            <InputField label="Confirm password" type="password" placeholder="Confirm password" id="confirmPassword" />
            <TermsCheckbox onAcceptChange={setTermsAccepted} />
          </div>
          <button
            type="submit"
            disabled={!termsAccepted}
            className="p-3 w-full text-lg font-bold bg-yellow-300 rounded-2xl cursor-pointer border-none text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
        </form>
      </div>
    </div>
  );
};
