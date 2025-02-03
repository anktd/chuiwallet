import { useState, useEffect } from 'react';
import Splash from '@src/01_Splash/Splash';
import { PasswordSetup } from '@src/02_SetPassword/PasswordSetup';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return showSplash ? <Splash /> : <PasswordSetup />;
};

export default App;
