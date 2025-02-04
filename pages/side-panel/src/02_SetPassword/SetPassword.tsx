import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { InputField } from '../components/InputField';
import { TermsCheckbox } from '../components/TermsCheckbox';
import { Button } from '@src/components/Button';

export const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  return (
    <div className="flex flex-col h-screen px-5 pt-12 pb-[19px] bg-dark">
      <div className="flex flex-col flex-1">
        <div className="flex flex-col items-center self-center max-w-full text-center w-full">
          <h1 className="w-full text-2xl font-bold leading-loose text-white max-sm:text-2xl">Set up a password</h1>
          <div className="mt-3 w-full text-lg leading-6 text-foreground max-sm:text-base">
            <span>It will be used to access Chui</span>
            <br />
            <span>on this browser</span>
          </div>
        </div>
        <div className="flex flex-col justify-between mt-6 w-full flex-1 text-lg font-bold leading-8 gap-3">
          <div className="flex flex-col justify-start gap-3">
            <InputField label="Password" type="password" placeholder="Password" id="password" />
            <InputField label="Confirm password" type="password" placeholder="Confirm password" id="confirmPassword" />
            <TermsCheckbox onAcceptChange={setTermsAccepted} />
          </div>
          <Button
            onClick={() => {
              navigate('/onboard/generate-seed');
            }}
            tabIndex={0}
            disabled={!termsAccepted}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
