import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { GameProvider } from './context/GameContext'
import './index.css'

// Register service worker for PWA support
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('Service Worker registered:', registration)
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error)
      })
  })
}

if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined)
  StatusBar.setBackgroundColor({ color: '#2563eb' }).catch(() => undefined)
  StatusBar.setStyle({ style: Style.Light }).catch(() => undefined)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
)
