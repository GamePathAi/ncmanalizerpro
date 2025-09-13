import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireEmailVerified?: boolean;
  requireActiveSubscription?: boolean;
  allowedStatuses?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireEmailVerified = false,
  requireActiveSubscription = false,
  allowedStatuses = null,
}) => {
  const { 
    user, 
    profile,
    loading, 
    userState, 
    needsEmailVerification, 
    needsSubscription, 
    canAccessDashboard 
  } = useAuth();
  const location = useLocation();

  // Mostrar loading apenas se realmente está carregando dados essenciais
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Verificar se requer autenticação
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar allowedStatuses se especificado
  if (allowedStatuses && user && profile) {
    const userStatus = profile.subscription_status;
    if (!allowedStatuses.includes(userStatus)) {
      // Redirecionar baseado no status atual
      switch (userStatus) {
        case 'pending_email':
          return <Navigate to="/verify-email" replace />;
        case 'pending_subscription':
          return <Navigate to="/pricing" replace />;
        case 'active':
          return <Navigate to="/dashboard" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
  }

  // Verificar se requer email verificado (fallback)
  if (requireEmailVerified && user && needsEmailVerification) {
    return <Navigate to="/verify-email" replace />;
  }

  // Verificar se requer assinatura ativa (fallback)
  if (requireActiveSubscription && user && needsSubscription) {
    return <Navigate to="/pricing" replace />;
  }

  // Para dashboard, verificar se pode acessar (fallback)
  if (requireActiveSubscription && user && !canAccessDashboard) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
};

// Componente para rotas que só devem ser acessadas por usuários não autenticados
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  // Mostrar loading apenas se realmente está carregando dados essenciais
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se o usuário está logado, redirecionar baseado no estado
  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

// Componente para redirecionamento baseado no estado do usuário
export const StateBasedRedirect: React.FC = () => {
  const { 
    user, 
    loading, 
    needsEmailVerification, 
    needsSubscription, 
    canAccessDashboard 
  } = useAuth();

  // Mostrar loading apenas se realmente está carregando dados essenciais
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está logado, ir para auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se email não está verificado, ir para verificação
  if (needsEmailVerification) {
    return <Navigate to="/verify-email" replace />;
  }

  // Se precisa de assinatura, ir para pricing
  if (needsSubscription) {
    return <Navigate to="/pricing" replace />;
  }

  // Se pode acessar dashboard, ir para lá
  if (canAccessDashboard) {
    return <Navigate to="/dashboard" replace />;
  }

  // Fallback: ir para pricing se não conseguir determinar o estado
  return <Navigate to="/pricing" replace />;
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