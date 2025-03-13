import Wallet from '@extension/backend/src/modules/wallet';
import { Button } from '@src/components/Button';
import Header from '@src/components/Header';
import type { StoredAccount, Currencies } from '@src/types';
import { currencyMapping } from '@src/types';
import { formatNumber } from '@src/utils';
import { getSessionPassword } from '@src/utils/sessionStorageHelper';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface SendPreviewStates {
  destinationAddress: string;
  amountBtc: number;
  amountUsd: number;
  feeBtc: number;
  feeUsd: number;
  sats: number;
}

export function SendPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currency } = useParams<{ currency: Currencies }>();
  const states = location.state as SendPreviewStates;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    const storedPwd = await getSessionPassword();
    if (storedPwd) {
      chrome.storage.local.get(['storedAccount'], res => {
        const storedAccount: StoredAccount | undefined = res.storedAccount;
        if (storedAccount) {
          const restoredMnemonic = Wallet.getDecryptedMnemonic(storedAccount.encryptedMnemonic, storedPwd);
          if (!restoredMnemonic) {
            console.error('Failed to recover seed with stored password.');
          }

          const walletData = {
            password: storedPwd!,
            mnemonic: restoredMnemonic!,
            network: storedAccount.network,
            addressType: 'p2pkh',
            accountIndex: storedAccount.selectedAccountIndex,
          };

          chrome.runtime.sendMessage(
            {
              action: 'signAndSendTransaction',
              walletData,
              to: states.destinationAddress,
              amount: states.amountBtc * 1e8,
              feeRates: states.feeBtc * 1e8,
            },
            response => {
              if (response?.success) {
                const transactionHash = response.txid;
                console.log(transactionHash);
                if (transactionHash) {
                  navigate(`/send/${currency}/status`, {
                    state: {
                      status: 'success',
                      transactionHash,
                    },
                  });
                } else {
                  setError('Failed to broadcast transaction');
                }
              } else {
                setError(response.error);
              }
              setConfirmLoading(false);
            },
          );
        }
      });
    } else {
      setError('Wallet is null');
    }
  };

  return (
    <div className="relative flex flex-col items-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Confirm Transaction" />

      <div className="flex flex-col mt-14 w-full text-lg">
        <div className="flex flex-col w-full leading-none">
          <div className="font-medium text-white">Asset Sent</div>
          <div className="flex gap-2 items-center mt-2 w-full text-foreground-79">
            <img
              loading="lazy"
              src={chrome.runtime.getURL(`popup/${currency}_coin.svg`)}
              className="object-contain shrink-0 self-stretch my-auto w-8 aspect-square"
              alt="Asset"
            />
            <div className="self-stretch my-auto">
              {currency ? currencyMapping[currency] : 'Unknown'} ({currency?.toUpperCase()})
            </div>
          </div>
        </div>
        <div className="flex flex-col mt-6 w-full flex-wrap">
          <div className="font-medium leading-none text-white">Destination address</div>
          <div className="mt-2 leading-6 text-foreground-79 text-wrap break-all">{states.destinationAddress}</div>
        </div>
        <div className="flex flex-col mt-6 w-full leading-none text-foreground-79">
          <div className="font-medium text-white">Amount to send</div>
          <div className="mt-2">{formatNumber(states.amountBtc, 8)} BTC</div>
          <div className="mt-2">{formatNumber(states.amountUsd)} USD</div>
        </div>
        <div className="flex flex-col mt-6 w-full leading-none text-foreground-79">
          <div className="font-medium text-white">Fee</div>
          <div className="mt-2">
            {formatNumber(states.feeBtc, 8)} BTC <span className="text-sm">({formatNumber(states.sats)} sat/vB)</span>
          </div>
          <div className="mt-2">{formatNumber(states.feeUsd)} USD</div>
        </div>
      </div>
      <Button className="absolute w-full bottom-[19px]" onClick={handleConfirm}>
        Confirm & Send
      </Button>
    </div>
  );
}
