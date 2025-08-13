import React from 'react'

type ErrorBoundaryProps = { children: React.ReactNode }

type ErrorBoundaryState = { hasError: boolean; message?: string; stack?: string }

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
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50 text-red-800">
          <div className="max-w-xl w-full space-y-3">
            <h2 className="text-lg font-semibold">Si è verificato un errore nell'app</h2>
            {this.state.message && (
              <p className="text-sm">{this.state.message}</p>
            )}
            {this.state.stack && (
              <pre className="text-xs overflow-auto bg-white p-3 border rounded max-h-64">
                {this.state.stack}
              </pre>
            )}
            <p className="text-xs text-red-700">I dettagli completi sono stati stampati in console.</p>
          </div>
        </div>
      )
    }
    return this.props.children as React.ReactElement
  }
}

export default ErrorBoundary