type FiatCurrencySelectorProps = {
  currency: string;
  arrowIconSrc: string;
};

function FiatCurrencySelector({ currency, arrowIconSrc }: FiatCurrencySelectorProps) {
  return (
    <div className="flex flex-col w-full">
      <div className="text-base leading-none text-white">Fiat currency</div>
      <div className="text-xs leading-6 text-neutral-200">Choose the global fiat currency</div>
      <div className="flex flex-col w-full text-lg leading-8 whitespace-nowrap text-foreground-79">
        <div className="flex gap-2.5 justify-center items-center px-2.5 py-3 w-full rounded-2xl border border-solid bg-stone-900 border-background-42">
          <div className="self-stretch my-auto w-[213px]">{currency}</div>
          <img
            loading="lazy"
            src={arrowIconSrc}
            alt=""
            className="object-contain shrink-0 self-stretch my-auto w-2.5 aspect-[0.91]"
          />
        </div>
      </div>
    </div>
  );
}

export default FiatCurrencySelector;
