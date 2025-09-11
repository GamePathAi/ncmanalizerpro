import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EmailVerificationPage } from '../Pages/EmailVerificationPage';
import { PricingPage } from '../Pages/PricingPage';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresSubscription?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiresSubscription = true 
}) => {
  const { 
    user, 
    loading, 
    needsEmailVerification, 
    needsSubscription, 
    canAccessDashboard 
  } = useAuth();

  // Mostrar loading enquanto carrega
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Se não está logado, redirecionar para login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Acesso Restrito
            </h2>
            <p className="text-gray-600 mb-6">
              Você precisa estar logado para acessar esta página.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'auth' } }))}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado: pending_email - Precisa confirmar email
  if (needsEmailVerification) {
    return <EmailVerificationPage />;
  }

  // Estado: pending_subscription - Precisa assinar
  if (needsSubscription && requiresSubscription) {
    return <PricingPage />;
  }

  // Estado: active - Pode acessar o conteúdo
  if (canAccessDashboard || !requiresSubscription) {
    return <>{children}</>;
  }

  // Fallback - não deveria chegar aqui
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Verificando Acesso...
          </h2>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    </div>
  );
};

// Componente para rotas que não requerem assinatura (como configurações)
export const ProtectedRouteBasic: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requiresSubscription={false}>
      {children}
    </ProtectedRoute>
  );
};

// HOC para proteger componentes
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  requiresSubscription = true
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiresSubscription={requiresSubscription}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}