import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const rootElement = document.getElementById('root');

const renderError = ({ message, filename, lineno, colno, error }) => {
  if (!rootElement) return;
  rootElement.innerHTML = `
    <div style="background:#0f172a;color:#f87171;font-family:system-ui,sans-serif;padding:24px;">
      <h1 style="margin-top:0;font-size:1.5rem;">Frontend runtime error</h1>
      <p><strong>${message}</strong></p>
      <p>${filename}:${lineno}:${colno}</p>
      <pre style="white-space:pre-wrap;overflow:auto;margin-top:1rem;color:#f8fafc;">${error?.stack || ''}</pre>
    </div>
  `;
};

window.onerror = (message, filename, lineno, colno, error) => {
  renderError({ message, filename, lineno, colno, error });
  return false;
};

window.onunhandledrejection = (event) => {
  renderError({ message: event.reason?.message || String(event.reason), filename: '', lineno: 0, colno: 0, error: event.reason });
};

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
