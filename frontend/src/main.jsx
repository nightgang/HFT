import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import axios from "axios";
import "./index.css";

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
  process.exit(1);
}

const renderError = ({ message, filename, lineno, colno, error }) => {
  if (!rootElement) return;
  // Create error UI without using innerHTML to prevent XSS
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
  
  rootElement.innerHTML = '';
  rootElement.appendChild(errorDiv);
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
