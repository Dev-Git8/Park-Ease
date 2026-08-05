import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-surface p-4">
                    <div className="max-w-md w-full bg-white rounded-card-lg shadow-sm p-8 text-center border border-hairline">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="font-outfit text-2xl font-medium text-ink mb-2">Something went wrong</h2>
                        <p className="text-ink-soft mb-8 text-sm">
                            The application encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-navy text-white px-8 py-3 rounded-pill text-sm font-medium uppercase tracking-wide hover:bg-navy-deep transition-colors"
                        >
                            Refresh page
                        </button>
                        {import.meta.env.DEV && (
                            <pre className="mt-8 p-4 bg-surface rounded-xl text-left text-xs overflow-auto text-red-600 font-mono border border-hairline">
                                {this.state.error && this.state.error.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
