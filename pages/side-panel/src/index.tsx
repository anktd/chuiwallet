import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@src/index.css';
import { App } from './00_App/App';

function init() {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);
  root.render(
    <HashRouter>
      <App />
    </HashRouter>,
  );
}

init();
