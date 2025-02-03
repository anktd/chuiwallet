import AddressQRCode from '@src/components/AddressQRCode';
import Header from '@src/components/Header';
import type * as React from 'react';

const Receive: React.FC = () => {
  return (
    <div className="flex overflow-hidden flex-col pb-5 font-bold text-white bg-neutral-900 max-w-[375px]">
      <Header title="Receive" />
      <AddressQRCode bitcoinAddress="bc1qc4tcgucdn0py28v5za4j2pxmy02zuw0wnmchp6" />
      <button
        className="gap-2.5 self-center px-2.5 py-3 mt-14 w-full text-lg leading-8 bg-yellow-300 rounded-2xl max-w-[338px] text-neutral-900"
        tabIndex={0}>
        Copy address
      </button>
    </div>
  );
};

export default Receive;
