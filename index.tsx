import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

if (!PUBLISHABLE_KEY) {
  // Show a visible error instead of a blank screen
  root.render(
    <div style={{ fontFamily: 'sans-serif', padding: '40px', textAlign: 'center', background: '#1a1a2e', color: 'white', minHeight: '100vh' }}>
      <h1 style={{ color: '#ff6b6b' }}>⚠ Configuration Error</h1>
      <p>The environment variable <code>VITE_CLERK_PUBLISHABLE_KEY</code> is not set.</p>
      <p style={{ color: '#aaa' }}>Please add it in your Vercel / Netlify dashboard under <strong>Environment Variables</strong> and redeploy.</p>
    </div>
  );
} else {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </React.StrictMode>
  );
}
