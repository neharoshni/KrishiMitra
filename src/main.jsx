// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Optional if you want global styling
import { GoogleOAuthProvider } from '@react-oauth/google';

// Replace with your actual Google Client ID
const clientId = "410081375756-oqboesriqtgligpm18uf9gm28oq08n6d.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
