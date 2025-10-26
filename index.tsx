
import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import AppWithAuth from './App';
import { ClerkAuthProvider } from './contexts/ClerkAuthProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ClerkAuthProvider>
      <AppWithAuth />
    </ClerkAuthProvider>
  </React.StrictMode>
);
