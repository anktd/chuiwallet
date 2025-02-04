import Header from '@src/components/Header';
import FiatCurrencySelector from './FIatCurrencySelector';

export const Settings: React.FC = () => {
  return (
    <div className="flex overflow-hidden flex-col items-center pb-5 font-bold bg-dark]">
      <Header title="Settings" />
      <div className="flex flex-col mt-10 w-full max-w-[328px]">
        <FiatCurrencySelector
          currency="USD"
          arrowIconSrc="https://cdn.builder.io/api/v1/image/assets/TEMP/089cd0d182a250c79bcf29b22da0eabf89bae1e0403a00851b188c3f01f048d5?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
        />
        <div className="flex self-start py-2 mt-2 min-h-[16px]" />
        <div className="flex gap-10 justify-between items-start mt-2 w-full text-base leading-none text-white">
          <div>Advanced Settings</div>
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/e62a2f0dfe32fef272f88a4628802b0ead234b8276035d9390952bebe29b3f20?placeholderIfAbsent=true&apiKey=7730bdd605464082ae23b346c3cac1f8"
            alt=""
            className="object-contain shrink-0 w-6 aspect-square"
          />
        </div>
      </div>
      <div className="flex gap-5 justify-between mt-96 w-full text-xs leading-6 text-white max-w-[328px]">
        <div className="self-stretch">Terms and services</div>
        <div className="self-stretch whitespace-nowrap">Help</div>
      </div>
    </div>
  );
};

export default Settings;
