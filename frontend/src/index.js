import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import SolanaWalletProvider from './WalletProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SolanaWalletProvider>
      <App />
    </SolanaWalletProvider>
  </React.StrictMode>
);
