type FiatCurrencySelectorProps = {
  currency: string;
};

function FiatCurrencySelector({ currency }: FiatCurrencySelectorProps) {
  return (
    <div className="flex flex-col justify-center w-full gap-[2px]">
      <div className="text-[16px] leading-[22px] text-white font-bold">Fiat currency</div>
      <div className="text-[12px] leading-[22px] text-[#E7E7E7]">Choose the global fiat currency</div>
      <div className="flex flex-col w-full text-lg leading-8 whitespace-nowrap text-neutral-500">
        <div className="flex gap-2.5 justify-center items-center px-2.5 py-3 w-full rounded-2xl border border-solid bg-stone-900 border-neutral-700">
          <div className="self-stretch my-auto w-[213px]">{currency}</div>
          <img
            loading="lazy"
            src={chrome.runtime.getURL(`popup/dropdown_arrow_icon.svg`)}
            alt=""
            className="object-contain shrink-0 self-stretch my-auto w-2.5 aspect-[0.91]"
          />
        </div>
      </div>
    </div>
  );
}

export default FiatCurrencySelector;
