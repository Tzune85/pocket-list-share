import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Aggiorna lo stato così il prossimo render mostrerà l'UI di fallback
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Puoi anche loggare l'errore in un servizio di reporting
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            // Puoi renderizzare qualsiasi UI di fallback
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
                        <div className="flex items-center mb-4">
                            <svg className="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-xl font-bold text-gray-800">
                                Qualcosa è andato storto
                            </h2>
                        </div>
                        
                        <p className="text-gray-600 mb-4">
                            Ci scusiamo per l'inconveniente. Abbiamo registrato l'errore e lo risolveremo il prima possibile.
                        </p>

                        <div className="bg-red-50 rounded p-4 mb-4">
                            <p className="text-sm font-mono text-red-600 break-all">
                                {this.state.error && this.state.error.toString()}
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
                        >
                            Ricarica la pagina
                        </button>

                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details className="mt-4">
                                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                                    Dettagli tecnici
                                </summary>
                                <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired
};

export default ErrorBoundary; 