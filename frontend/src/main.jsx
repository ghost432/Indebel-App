import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'

// Ignore noise from third-party tracking scripts (monitoring.indebel.be, op1.js, 200.js) and extension postMessage errors
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('Cannot convert object to primitive value') ||
    event.filename?.includes('200.js') ||
    event.filename?.includes('op1.js') ||
    event.filename?.includes('monitoring')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('Cannot convert object to primitive value') ||
    event.reason?.stack?.includes('200.js') ||
    event.reason?.stack?.includes('op1.js')
  ) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>,
)
