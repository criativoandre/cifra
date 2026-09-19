import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from '@cifra-app/shared';
import { supabase } from './lib/supabase';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider client={supabase}>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
