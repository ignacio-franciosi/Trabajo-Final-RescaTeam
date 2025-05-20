import './index.css'
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './routes/AppRouter';
import { AuthProvider } from './context/AuthContext';

import './index.css'; // si estás usando Tailwind o estilos propios

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);
