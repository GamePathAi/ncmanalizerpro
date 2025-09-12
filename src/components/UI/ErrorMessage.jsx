import React from 'react';
import { ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Componente de mensagem de erro reutilizável
 */
const ErrorMessage = ({
  title = 'Erro',
  message,
  type = 'error',
  showIcon = true,
  showRetry = false,
  onRetry = null,
  retryText = 'Tentar novamente',
  className = '',
  size = 'md',
  dismissible = false,
  onDismiss = null
}) => {
  const typeConfig = {
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      titleColor: 'text-red-900',
      iconColor: 'text-red-400',
      buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: XCircleIcon
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      titleColor: 'text-yellow-900',
      iconColor: 'text-yellow-400',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      icon: ExclamationTriangleIcon
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      titleColor: 'text-blue-900',
      iconColor: 'text-blue-400',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      icon: InformationCircleIcon
    }
  };

  const sizeConfig = {
    sm: {
      padding: 'p-3',
      iconSize: 'w-4 h-4',
      titleSize: 'text-sm font-medium',
      messageSize: 'text-sm',
      buttonSize: 'px-3 py-1 text-sm'
    },
    md: {
      padding: 'p-4',
      iconSize: 'w-5 h-5',
      titleSize: 'text-base font-medium',
      messageSize: 'text-sm',
      buttonSize: 'px-4 py-2 text-sm'
    },
    lg: {
      padding: 'p-6',
      iconSize: 'w-6 h-6',
      titleSize: 'text-lg font-medium',
      messageSize: 'text-base',
      buttonSize: 'px-6 py-3 text-base'
    }
  };

  const config = typeConfig[type];
  const sizeStyles = sizeConfig[size];
  const IconComponent = config.icon;

  return (
    <div className={`rounded-lg border ${config.bgColor} ${config.borderColor} ${sizeStyles.padding} ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <IconComponent className={`${sizeStyles.iconSize} ${config.iconColor}`} />
          </div>
        )}
        
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          <h3 className={`${sizeStyles.titleSize} ${config.titleColor}`}>
            {title}
          </h3>
          
          {message && (
            <div className={`mt-1 ${sizeStyles.messageSize} ${config.textColor}`}>
              {typeof message === 'string' ? (
                <p>{message}</p>
              ) : (
                message
              )}
            </div>
          )}
          
          {showRetry && onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className={`inline-flex items-center ${sizeStyles.buttonSize} font-medium text-white ${config.buttonColor} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200`}
              >
                {retryText}
              </button>
            </div>
          )}
        </div>
        
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 ${config.textColor} hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent`}
              >
                <span className="sr-only">Fechar</span>
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Componente de erro para tela cheia
 */
export const FullScreenError = ({
  title = 'Algo deu errado',
  message = 'Ocorreu um erro inesperado. Tente novamente.',
  showRetry = true,
  onRetry = () => window.location.reload(),
  retryText = 'Recarregar página',
  showHome = true,
  onHome = () => window.location.href = '/',
  homeText = 'Voltar ao início'
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-16 w-16 text-red-400" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">{message}</p>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {retryText}
              </button>
            )}
            
            {showHome && (
              <button
                type="button"
                onClick={onHome}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {homeText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de erro inline
 */
export const InlineError = ({
  message,
  className = ''
}) => {
  return (
    <div className={`flex items-center text-red-600 text-sm ${className}`}>
      <XCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

/**
 * Componente de erro para formulários
 */
export const FormError = ({
  message,
  className = ''
}) => {
  if (!message) return null;
  
  return (
    <div className={`mt-1 text-sm text-red-600 ${className}`}>
      {message}
    </div>
  );
};

/**
 * Componente de toast de erro
 */
export const ErrorToast = ({
  title = 'Erro',
  message,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-white rounded-lg shadow-lg border border-red-200 p-4">
        <div className="flex items-start">
          <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <h4 className="text-sm font-medium text-red-900">{title}</h4>
            {message && (
              <p className="mt-1 text-sm text-red-700">{message}</p>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-4 inline-flex text-red-400 hover:text-red-600 focus:outline-none"
            >
              <XCircleIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de boundary de erro
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <FullScreenError
          title="Erro na aplicação"
          message="Ocorreu um erro inesperado. A página será recarregada."
          onRetry={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorMessage;