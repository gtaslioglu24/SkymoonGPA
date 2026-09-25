import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './lib/i18n'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PLAUSIBLE_DOMAIN } from './lib/config'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
)

if (import.meta.env.PROD) {
  // Offline support. Registered after load so it never competes with the first
  // paint, and only in production so dev reloads aren't served from cache.
  window.addEventListener('load', () => {
    navigator.serviceWorker?.register('/sw.js').catch(() => {
      /* unsupported or blocked — the app works fine online */
    })
  })

  // Analytics stays off unless VITE_PLAUSIBLE_DOMAIN is set: no cookies, no
  // third-party request, nothing to disclose, until you opt in.
  if (PLAUSIBLE_DOMAIN) {
    const s = document.createElement('script')
    s.defer = true
    s.dataset.domain = PLAUSIBLE_DOMAIN
    s.src = 'https://plausible.io/js/script.js'
    document.head.appendChild(s)
  }
}
