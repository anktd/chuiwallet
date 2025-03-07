import Header from '@src/components/Header';
import FiatCurrencySelector from '../components/FIatCurrencySelector';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col text-white bg-dark h-full px-4 pt-12 pb-[19px]">
      <Header title="Settings" />
      <div className="flex flex-col justify-center mt-[40px] w-full max-w-[328px] gap-[8px]">
        <FiatCurrencySelector currency="USD" />

        <div className="flex self-start py-2 mt-2 min-h-[16px] w-full" />

        <button
          className="flex gap-10 justify-between items-start mt-2 w-full text-base leading-none text-white"
          onClick={() => navigate('/settings/advanced')}>
          <span className="text-[16px] font-bold">Advanced Settings</span>
          <img
            loading="lazy"
            src={chrome.runtime.getURL(`popup/right_arrow_icon.svg`)}
            alt=""
            className="object-contain shrink-0 w-6 aspect-square"
          />
        </button>
      </div>

      <div className="flex gap-5 justify-between w-full text-xs leading-6 text-white max-w-[328px]">
        <div className="self-stretch">Terms and services</div>
        <div className="self-stretch whitespace-nowrap">Help</div>
      </div>
    </div>
  );
};

export default Settings;
