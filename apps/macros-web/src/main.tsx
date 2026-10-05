import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { QueryProvider } from './app/QueryProvider';
import { SessionProvider } from './app/SessionProvider';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <SessionProvider>
      <QueryProvider>
        <App />
      </QueryProvider>
    </SessionProvider>
  </StrictMode>,
);
