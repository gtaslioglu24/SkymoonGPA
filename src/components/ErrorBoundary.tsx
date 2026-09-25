import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from 'react';
import { clearAppData } from '../lib/storage';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

const button: CSSProperties = {
  borderRadius: 10,
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

/**
 * Catches render-time errors so a crash shows a friendly recovery card instead
 * of a blank white screen. Intentionally self-contained (no context/i18n) so it
 * still renders if the app tree is broken.
 *
 * "Reload" alone is a trap when the cause is bad persisted state: the reload
 * reads the same bad value and crashes again, forever, with no way out that
 * doesn't involve devtools. The second button is the actual escape hatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced in the console; wire to an error reporter here if desired.
    console.error('App crashed:', error, info);
  }

  private reset = () => {
    clearAppData();
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter Variable, Inter, system-ui, sans-serif',
          color: '#3f342a',
          background: '#f4f1ea',
        }}
      >
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">
            🌙
          </div>
          <h1
            style={{
              fontFamily: 'Fraunces Variable, Fraunces, Georgia, serif',
              fontSize: 24,
              margin: '0 0 8px',
            }}
          >
            Bir şeyler ters gitti
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 20px', color: '#5c5349' }}>
            Beklenmedik bir hata oluştu. Önce sayfayı yenilemeyi dene; sorun sürerse kayıtlı
            verilerini sıfırla.
            <br />
            <span>
              Something went wrong. Try reloading; if it keeps happening, reset your saved data.
            </span>
          </p>
          <div
            style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ ...button, background: '#8f2c3d', color: '#fff', border: 'none' }}
            >
              Yenile / Reload
            </button>
            <button
              type="button"
              onClick={this.reset}
              style={{
                ...button,
                background: 'transparent',
                color: '#5c5349',
                border: '1px solid #d8d1c4',
              }}
            >
              Verileri sıfırla / Reset data
            </button>
          </div>
        </div>
      </div>
    );
  }
}
