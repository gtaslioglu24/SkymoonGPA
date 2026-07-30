import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Catches render-time errors so a crash shows a friendly recovery card instead
 * of a blank white screen. Intentionally self-contained (no context/i18n) so it
 * still renders if the app tree is broken.
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

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#3f342a',
          background: '#f4f1ea',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌙</div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 24, margin: '0 0 8px' }}>
            Bir şeyler ters gitti
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.8, margin: '0 0 20px' }}>
            Beklenmedik bir hata oluştu. Sayfayı yenilemek genelde çözer.
            <br />
            <span style={{ opacity: 0.7 }}>Something went wrong — reloading usually fixes it.</span>
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: '#8f2c3d',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Yenile / Reload
          </button>
        </div>
      </div>
    );
  }
}
