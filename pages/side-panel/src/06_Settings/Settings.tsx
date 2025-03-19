import Header from '@src/components/Header';
import FiatCurrencySelector from '../components/FiatCurrencySelector';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-center text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Settings" />

      <div className="flex flex-col justify-center mt-[40px] w-full gap-[8px] max-w-[600px] mx-auto">
        <FiatCurrencySelector options={['USD', 'BTC']} />

        <div className="flex self-start my-2 h-[1px] w-full bg-background-5f" />

        <button
          className="flex gap-10 justify-between items-start py-2 w-full text-base leading-none text-white"
          onClick={() => navigate('/settings/advanced')}>
          <span className="text-base font-bold">Advanced Settings</span>
          <img
            loading="lazy"
            src={chrome.runtime.getURL(`popup/right_arrow_icon.svg`)}
            alt=""
            className="object-contain shrink-0 w-6 aspect-square"
          />
        </button>
      </div>

      <div className="absolute left-4 right-4 bottom-[25px] flex gap-5 justify-between text-xs leading-6 text-white max-w-[600px] mx-auto">
        <div className="self-stretch">
          <a className="underline font-bold text-xs" href="https://www.blockonomics.co/privacy" target="_blank">
            Terms and services
          </a>
        </div>
        <div className="self-stretch whitespace-nowrap">
          <a className="underline font-bold text-xs" href="https://help.blockonomics.co/" target="_blank">
            Help
          </a>
        </div>
      </div>
    </div>
  );
};

export default Settings;
