import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import axios from "axios";
import "./index.css";
/* inline styles needed by renderError (standalone overlay) */
const styleEl = document.createElement('style');
styleEl.textContent = `
  .rf-error {
    display: none !important;
  }
  .rf-error-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(7, 11, 18, 0.92);
  }
`;
document.head.appendChild(styleEl);
axios.defaults.baseURL = "/api";

// Add axios error interceptor for better error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('Root element not found');
  throw new Error('Root element #root not found in DOM');
}

/**
 * Render the current app error to a standalone overlay.
 *
 * The overlay is appended as a ATTRIBUTE SIBLING to `rootElement`
 * under `document.body`.  React never touches this node, so there is
 * no fibre/deletion mismatch regardless of when the error handler fires
 * (React commit phase, StrictMode double-mount, HMR unmount, etc.).
 */
const renderError = ({ message, filename, lineno, colno, error }) => {
  if (!rootElement) return;
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'background:#0f172a;color:#f87171;font-family:system-ui,sans-serif;padding:24px;';

  const title = document.createElement('h1');
  title.style.cssText = 'margin-top:0;font-size:1.5rem;';
  title.textContent = 'Frontend runtime error';

  const msgP = document.createElement('p');
  const strongMsg = document.createElement('strong');
  strongMsg.textContent = message;
  msgP.appendChild(strongMsg);

  const locP = document.createElement('p');
  locP.textContent = `${filename}:${lineno}:${colno}`;

  const preStack = document.createElement('pre');
  preStack.style.cssText = 'white-space:pre-wrap;overflow:auto;margin-top:1rem;color:#f8fafc;';
  preStack.textContent = error?.stack || 'No stack trace available';

  errorDiv.appendChild(title);
  errorDiv.appendChild(msgP);
  errorDiv.appendChild(locP);
  errorDiv.appendChild(preStack);

  rootElement.classList.add('rf-error');

  // Remove a stale overlay from a previous error, if present
  const existing = document.querySelector('.rf-error-overlay');
  if (existing) {
    try { existing.remove(); } catch { /* stale reference */ }
  }

  errorDiv.className = 'rf-error-overlay';
  document.body.appendChild(errorDiv);
};

window.onerror = (message, filename, lineno, colno, error) => {
  renderError({ message, filename, lineno, colno, error });
  return false;
};

window.onunhandledrejection = (event) => {
  renderError({
    message: event.reason?.message || String(event.reason),
    filename: "",
    lineno: 0,
    colno: 0,
    error: event.reason,
  });
};

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
