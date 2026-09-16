import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Automatically recover when a deployment updates asset hashes and older chunk JS returns 404
window.addEventListener('error', (event) => {
  const errorMsg = String(event?.message || event?.error || '');
  const isScript404 = event?.target?.tagName === 'SCRIPT' && String(event?.target?.src || '').includes('/assets/');
  if (
    isScript404 ||
    errorMsg.includes('Failed to fetch dynamically imported module') ||
    errorMsg.includes('Importing a module script failed') ||
    errorMsg.includes('Loading chunk')
  ) {
    const lastReload = sessionStorage.getItem('auto_chunk_reload');
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 10000) {
      sessionStorage.setItem('auto_chunk_reload', String(now));
      window.location.reload(true);
    }
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reasonMsg = String(event?.reason || '');
  if (
    reasonMsg.includes('Failed to fetch dynamically imported module') ||
    reasonMsg.includes('Importing a module script failed') ||
    reasonMsg.includes('Loading chunk')
  ) {
    const lastReload = sessionStorage.getItem('auto_chunk_reload');
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 10000) {
      sessionStorage.setItem('auto_chunk_reload', String(now));
      window.location.reload(true);
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
