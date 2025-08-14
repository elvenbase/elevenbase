import React from 'react'

type ErrorBoundaryProps = { children: React.ReactNode }

type ErrorBoundaryState = { hasError: boolean; message?: string; stack?: string; componentStack?: string }

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message, stack: (error as any)?.stack }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log dettagliato in console per diagnosi
    // Evita di inviare network log in prod, ci basta console per ora
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error)
    // eslint-disable-next-line no-console
    console.error('Error info:', errorInfo)
    this.setState({ componentStack: errorInfo?.componentStack })
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state
      const isMimeError = typeof error?.message === 'string' && error.message.includes("'text/html' is not a valid JavaScript MIME type")
      return (
        <div className="p-4">
          <h2 className="font-bold mb-2">Si è verificato un errore</h2>
          <pre className="whitespace-pre-wrap text-sm bg-muted p-2 rounded mb-2">{String(error)}</pre>
          {isMimeError && (
            <div className="text-sm text-amber-600 mb-2">
              Potrebbe trattarsi di cache vecchia dell'app. Prova ad aggiornare la pagina con un hard-refresh.
            </div>
          )}
          {errorInfo && (
            <details className="text-xs opacity-80">
              <summary>Dettagli</summary>
              <pre className="whitespace-pre-wrap">{String(errorInfo?.componentStack || '')}</pre>
            </details>
          )}
          <button className="mt-3 px-3 py-1 border rounded" onClick={() => window.location.reload()}>Ricarica</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary