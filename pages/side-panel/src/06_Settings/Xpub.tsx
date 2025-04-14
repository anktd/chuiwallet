import type React from 'react';
import { useEffect, useState } from 'react';
import Header from '@src/components/Header';
import { Button } from '@src/components/Button';
import XpubQRCode from '@src/components/XpubQRCode';
import { useWalletContext } from '@src/context/WalletContext';

interface XpubResponse {
  jsonrpc: string;
  id: string;
  result: { xpub: string };
}

export const Xpub: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { wallet, getXpub } = useWalletContext();
  const [xpub, setXpub] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copyText, setCopyText] = useState<string>('Copy To Clipboard');

  const fetchXpub = async () => {
    setLoading(true);
    setError('');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let provider = (window as any).ChuiWalletProvider;
      // If not available, fall back to previous provider.
      if (!provider || !provider.request) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider = (window as any).btc;
      }
      if (provider && provider.request) {
        const response: XpubResponse = await provider.request('getXpub');
        if (response && response.result && response.result.xpub) {
          setXpub(response.result.xpub);
        } else {
          throw new Error('No xPub returned from wallet');
        }
      } else {
        const xpubResult = await getXpub();
        setXpub(xpubResult);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to fetch xPub key');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchXpub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyToClipboard = async () => {
    try {
      if (!xpub) {
        console.error('xPub not found');
        return;
      }

      await navigator.clipboard.writeText(xpub);

      setCopyText('Copied!');
      setTimeout(() => {
        setCopyText('Copy To Clipboard');
      }, 3000);
    } catch (err) {
      console.error('Failed to copy seed:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-dark text-white px-5 pt-12 pb-[19px]">
      <Header title="Wallet xPub" />
      <div className="flex flex-col flex-1 items-center justify-center">
        {loading ? (
          <div className="text-lg">Loading...</div>
        ) : error ? (
          <div className="text-lg text-primary-red">Error: {error}</div>
        ) : xpub ? (
          <>
            <XpubQRCode xpub={xpub} currency="btc" />
          </>
        ) : (
          <div className="text-lg">No xPub key available.</div>
        )}
      </div>
      <Button onClick={handleCopyToClipboard} disabled={loading}>
        {copyText}
      </Button>
    </div>
  );
};

export default Xpub;
