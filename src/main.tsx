import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { GameProvider } from './context/GameContext'
import './index.css'
import { loadNativeStoredGameState } from './platform/storage'

// Register service worker for PWA support
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
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

const startApp = async () => {
  const initialState = Capacitor.isNativePlatform() ? await loadNativeStoredGameState() : undefined;
  ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider initialState={initialState}>
      <App />
    </GameProvider>
  </StrictMode>,
)
}

void startApp()
