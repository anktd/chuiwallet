import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { InputField } from '../components/InputField';
import { TermsCheckbox } from '../components/TermsCheckbox';
import { Button } from '@src/components/Button';
import WalletManager from '@extension/backend/src/walletManager';
import { useWalletContext } from '../context/WalletContext';
import { getPasswordStrength } from '@src/utils';

export const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { setWallet } = useWalletContext();

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const passwordStrength = getPasswordStrength(password);

  let strengthColorClass = 'text-red-500';

  if (passwordStrength === 'medium') {
    strengthColorClass = 'text-yellow-500';
  } else if (passwordStrength === 'strong') {
    strengthColorClass = 'text-green-500';
  }

  const handleNext = async () => {
    setErrorMsg('');

    if (!termsAccepted) {
      setErrorMsg('Please accept the terms.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (passwordStrength !== 'strong') {
      setErrorMsg('Please choose a stronger password.');
      return;
    }

    const manager = new WalletManager();

    const wallet = manager.createWallet({
      password,
      network: 'mainnet',
      addressType: 'p2pkh',
    });

    setWallet(wallet, password);

    navigate('/onboard/choose-method');
  };

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
            <InputField
              label="Password"
              type="password"
              placeholder="Password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            {password && (
              <span className={`text-xs ${strengthColorClass}`}>
                {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
              </span>
            )}

            <InputField
              label="Confirm password"
              type="password"
              placeholder="Confirm password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />

            <span className="mt-2 text-xs text-neutral-400 font-normal">
              Password must be at least 8 characters long, contain uppercase letters, digits, and special characters.
            </span>

            <TermsCheckbox onAcceptChange={setTermsAccepted} />

            {errorMsg && <span className="mt-1 text-xs text-red-500 font-light">{errorMsg}</span>}
          </div>

          <Button onClick={handleNext} tabIndex={0} disabled={!termsAccepted}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
