import React from 'react';

/**
 * Componente de loading spinner reutilizável
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  className = '',
  text = null 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600'
  };

  const spinnerClass = `animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  return (
    <div className="flex items-center justify-center">
      <svg 
        className={spinnerClass}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && (
        <span className="ml-2 text-sm text-gray-600">
          {text}
        </span>
      )}
    </div>
  );
};

/**
 * Componente de loading para tela cheia
 */
export const FullScreenLoader = ({ 
  text = 'Carregando...', 
  subtext = null,
  size = 'xl' 
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <LoadingSpinner size={size} color="blue" />
      <div className="mt-4 text-center">
        <p className="text-lg font-medium text-gray-900">{text}</p>
        {subtext && (
          <p className="mt-1 text-sm text-gray-500">{subtext}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Componente de loading inline
 */
export const InlineLoader = ({ 
  text = 'Carregando...', 
  size = 'sm',
  className = '' 
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <LoadingSpinner size={size} color="gray" />
      <span className="ml-2 text-sm text-gray-600">{text}</span>
    </div>
  );
};

/**
 * Componente de loading para botões
 */
export const ButtonLoader = ({ 
  size = 'sm', 
  color = 'white',
  className = '' 
}) => {
  return (
    <LoadingSpinner 
      size={size} 
      color={color} 
      className={className}
    />
  );
};

/**
 * Componente de skeleton loading
 */
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  animate = true 
}) => {
  const animationClass = animate ? 'animate-pulse' : '';
  
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className={`h-4 bg-gray-200 rounded ${animationClass}`} />
      ))}
    </div>
  );
};

/**
 * Componente de loading para cards
 */
export const CardLoader = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
        </div>
        <div className="mt-4 h-8 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
};

/**
 * Componente de loading para tabelas
 */
export const TableLoader = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded flex-1" />
            ))}
          </div>
        </div>
        
        {/* Rows */}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="px-6 py-4">
              <div className="flex space-x-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;