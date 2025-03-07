import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { InputField } from '@src/components/InputField';
import { Button } from '@src/components/Button';
import { useWalletContext } from '@src/context/WalletContext';
import WalletManager from '@extension/backend/src/walletManager';

export const PasswordLock: React.FC = () => {
  const navigate = useNavigate();
  const { setWallet } = useWalletContext();
  const [password, setPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  chrome.storage.local.get(null, data => {
    console.log('Stored data:', data);
  });

  const handleUnlock = async () => {
    setErrorMsg('');

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      chrome.storage.local.get(['encryptedMnemonic'], async res => {
        const { encryptedMnemonic } = res;

        if (!encryptedMnemonic) {
          setErrorMsg('No wallet data found. Please complete onboarding.');
          setLoading(false);
          return;
        }

        const manager = new WalletManager();

        const restoredWallet = manager.createWallet({
          password,
          network: 'mainnet',
          taproot: false,
        });

        const seed = restoredWallet.recoverMnemonic(password);
        if (!seed) {
          setErrorMsg('Incorrect password. Please try again.');
          setLoading(false);
          return;
        }

        setWallet(restoredWallet, password);

        navigate('/dashboard');
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen px-5 pt-12 pb-[19px] bg-dark items-center justify-center">
      <h1 className="text-2xl font-bold text-white mb-4">Welcome!</h1>
      <p className="text-neutral-400 text-sm mb-4">Chui is ready for you</p>
      <InputField
        label="Password"
        type="password"
        placeholder="Password"
        id="unlockPassword"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {errorMsg && <p className="mt-2 text-sm text-red-500">{errorMsg}</p>}
      <Button onClick={handleUnlock} tabIndex={0} disabled={loading}>
        {loading ? 'Unlocking...' : 'Unlock'}
      </Button>
    </div>
  );
};

export default PasswordLock;
