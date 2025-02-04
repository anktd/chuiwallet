import AddressQRCode from '@src/components/AddressQRCode';
import { Button } from '@src/components/Button';
import Header from '@src/components/Header';
import type * as React from 'react';

const Receive: React.FC = () => {
  return (
    <div className="flex overflow-hidden flex-col justify-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Receive" />
      <AddressQRCode bitcoinAddress="bc1qc4tcgucdn0py28v5za4j2pxmy02zuw0wnmchp6" />
      <div className="flex flex-row justify-center items-end flex-1 w-full">
        <Button tabIndex={0}>Copy address</Button>
      </div>
    </div>
  );
};

export default Receive;
