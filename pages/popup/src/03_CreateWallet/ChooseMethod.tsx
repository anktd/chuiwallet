import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { ButtonOutline } from '@src/components/ButtonOutline';

export const ChooseMethod: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex overflow-hidden flex-col justify-center items-center px-5 bg-dark h-full w-full gap-4">
      <ButtonOutline onClick={() => navigate('/onboard/generate-seed')}>Create new wallet</ButtonOutline>
      <ButtonOutline onClick={() => navigate('/onboard/restore-seed')}>I already have a seed phrase</ButtonOutline>
    </div>
  );
};
