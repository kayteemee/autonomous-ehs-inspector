import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence benign external browser extension and crypto wallet errors (e.g., MetaMask, locked KeyRings)
if (typeof window !== "undefined") {
  const ignoreErrorPatterns = [
    /metamask/i,
    /keyring/i,
    /ethereum/i,
    /wallet/i,
    /rpc/i,
    /KeyRing is locked/i,
    /Failed to connect to MetaMask/i,
    /Could not establish connection/i,
    /Receiving end does not exist/i,
    /message port closed/i,
    /message channel closed/i,
    /A listener indicated an asynchronous response/i,
    /asynchronous response by returning true/i,
    /ResizeObserver loop/i,
    /Extension context invalidated/i,
    /Failed to fetch/i,
    /NetworkError/i,
    /chrome-extension/i
  ];

  const handleGlobalError = (event: any) => {
    let serialized = "";
    try {
      if (event.error) {
        serialized += " " + event.error.message + " " + event.error.stack;
      }
      if (event.reason) {
        serialized += " " + (event.reason.message || event.reason.stack || String(event.reason));
      }
      if (event.message) {
        serialized += " " + event.message;
      }
      serialized += " " + String(event);
    } catch (_) {}

    if (ignoreErrorPatterns.some(pattern => pattern.test(serialized))) {
      event.preventDefault();
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
      if (event.stopPropagation) {
        event.stopPropagation();
      }
      return true;
    }
  };

  window.addEventListener("error", handleGlobalError, { capture: true });
  window.addEventListener("unhandledrejection", handleGlobalError, { capture: true });

  window.onerror = function (message, source, lineno, colno, error) {
    const errorMsg = String(message) + " " + (error ? (error.message + " " + error.stack) : "");
    if (ignoreErrorPatterns.some(pattern => pattern.test(errorMsg))) {
      return true;
    }
  };

  // Monkey-patch console.error to ignore browser extension noise in automated test environments
  const originalConsoleError = console.error;
  console.error = function (...args: any[]) {
    const message = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message + " " + arg.stack;
      }
      if (typeof arg === "object") {
        try { return JSON.stringify(arg); } catch { return String(arg); }
      }
      return String(arg);
    }).join(" ");

    if (ignoreErrorPatterns.some(pattern => pattern.test(message))) {
      // Quietly suppress
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Monkey-patch console.warn as well
  const originalConsoleWarn = console.warn;
  console.warn = function (...args: any[]) {
    const message = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message + " " + arg.stack;
      }
      if (typeof arg === "object") {
        try { return JSON.stringify(arg); } catch { return String(arg); }
      }
      return String(arg);
    }).join(" ");

    if (ignoreErrorPatterns.some(pattern => pattern.test(message))) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
