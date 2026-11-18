import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import { SchemaProvider } from './lib/schema';
import './index.css';

// O build de arquivo único roda em iframes que não preservam rotas no hash.
const Router = import.meta.env.MODE === 'single' ? MemoryRouter : HashRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <SchemaProvider>
        <App />
      </SchemaProvider>
    </Router>
  </React.StrictMode>,
);
