import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireEmailVerified?: boolean;
  requireActiveSubscription?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireEmailVerified = false,
  requireActiveSubscription = false,
}) => {
  const { user, loading, subscriptionStatus } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Verificar se requer autenticação
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Verificar se requer email verificado
  if (requireEmailVerified && user && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  // Verificar se requer assinatura ativa
  if (requireActiveSubscription && user && subscriptionStatus !== 'active') {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
};

// Componente para rotas que só devem ser acessadas por usuários não autenticados
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se o usuário está logado, redirecionar para o dashboard
  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

// Componente para redirecionamento baseado no estado do usuário
export const StateBasedRedirect: React.FC = () => {
  const { user, loading, subscriptionStatus } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está logado, ir para auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se email não está verificado, ir para verificação
  if (!user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  // Se não tem assinatura ativa, ir para pricing
  if (subscriptionStatus !== 'active') {
    return <Navigate to="/pricing" replace />;
  }

  // Se tudo está ok, ir para dashboard
  return <Navigate to="/dashboard" replace />;
};

// Hook para verificar permissões
export const usePermissions = () => {
  const { user, subscriptionStatus } = useAuth();

  return {
    isAuthenticated: !!user,
    isEmailVerified: !!user?.email_confirmed_at,
    hasActiveSubscription: subscriptionStatus === 'active',
    canAccessDashboard: !!user && !!user.email_confirmed_at && subscriptionStatus === 'active',
    canAccessPricing: !!user && !!user.email_confirmed_at,
    needsEmailVerification: !!user && !user.email_confirmed_at,
    needsSubscription: !!user && !!user.email_confirmed_at && subscriptionStatus !== 'active',
  };
};