
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence non-essential console output in production/preview
// TEMPORARILY DISABLED FOR DEBUG
// const isProductionBuild = import.meta.env.PROD || (typeof import.meta.env.VITE_APP_ENV === 'string' && import.meta.env.VITE_APP_ENV !== 'development');
// if (isProductionBuild) {
//   const noop = () => {};
//   (console as any).log = noop;
//   (console as any).debug = noop;
//   (console as any).info = noop;
//   (console as any).warn = noop;
//   (console as any).trace = noop;
// }

createRoot(document.getElementById("root")!).render(
  <App />
);
