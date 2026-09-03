import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { PublicAssetPage } from './components/PublicAssetPage'
import './styles.css'

const qrToken = new URLSearchParams(window.location.search).get('qr')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{qrToken ? <PublicAssetPage qrToken={qrToken} /> : <App />}</StrictMode>,
)
