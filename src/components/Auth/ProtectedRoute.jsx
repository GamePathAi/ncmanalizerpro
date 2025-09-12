import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

/**
 * Componente de rota protegida baseado em estados de usuário
 * 
 * Estados possíveis:
 * - pending_email: Usuário cadastrado mas não confirmou email
 * - pending_subscription: Email confirmado mas sem assinatura ativa  
 * - active: Email confirmado + assinatura ativa
 */
const ProtectedRoute = ({ 
  children, 
  requiresEmailVerified = false,
  requiresActiveSubscription = false,
  allowedStates = null,
  fallbackPath = null 
}) => {
  const { user, userProfile, loading, error, checkAuthState } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        await checkAuthState();
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [loading, checkAuthState]);

  // Mostrar loading enquanto verifica autenticação
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Verificando autenticação...</span>
      </div>
    );
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ErrorMessage 
          title="Erro de Autenticação"
          message={error}
          showRetry
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Usuário não autenticado
  if (!user || !userProfile) {
    return (
      <Navigate 
        to="/auth/login" 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  const { subscription_status } = userProfile;

  // Verificar estados específicos permitidos
  if (allowedStates && !allowedStates.includes(subscription_status)) {
    const redirectPath = getRedirectPath(subscription_status, fallbackPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Verificar se precisa de email verificado
  if (requiresEmailVerified && subscription_status === 'pending_email') {
    return <Navigate to="/auth/verify-email" replace />;
  }

  // Verificar se precisa de assinatura ativa
  if (requiresActiveSubscription && subscription_status !== 'active') {
    if (subscription_status === 'pending_email') {
      return <Navigate to="/auth/verify-email" replace />;
    }
    return <Navigate to="/pricing" replace />;
  }

  // Verificar se assinatura expirou
  if (subscription_status === 'active' && userProfile.subscription_expires_at) {
    const expirationDate = new Date(userProfile.subscription_expires_at);
    const now = new Date();
    
    if (expirationDate < now) {
      return <Navigate to="/pricing" replace />;
    }
  }

  // Usuário autorizado, renderizar children
  return children;
};

/**
 * Componente para rotas que precisam apenas de email verificado
 */
export const EmailVerifiedRoute = ({ children }) => {
  return (
    <ProtectedRoute requiresEmailVerified={true}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * Componente para rotas que precisam de assinatura ativa
 */
export const ActiveSubscriptionRoute = ({ children }) => {
  return (
    <ProtectedRoute requiresActiveSubscription={true}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * Componente para rotas específicas por estado
 */
export const StateBasedRoute = ({ children, allowedStates, fallbackPath }) => {
  return (
    <ProtectedRoute 
      allowedStates={allowedStates}
      fallbackPath={fallbackPath}
    >
      {children}
    </ProtectedRoute>
  );
};

/**
 * Componente para redirecionar baseado no estado atual
 */
export const StateRedirect = () => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/auth/login" replace />;
  }

  const redirectPath = getRedirectPath(userProfile.subscription_status);
  return <Navigate to={redirectPath} replace />;
};

/**
 * Hook para verificar permissões de acesso
 */
export const useRouteAccess = () => {
  const { userProfile } = useAuth();

  const canAccess = (requirements) => {
    if (!userProfile) return false;

    const { requiresEmailVerified, requiresActiveSubscription, allowedStates } = requirements;

    // Verificar estados específicos
    if (allowedStates && !allowedStates.includes(userProfile.subscription_status)) {
      return false;
    }

    // Verificar email verificado
    if (requiresEmailVerified && userProfile.subscription_status === 'pending_email') {
      return false;
    }

    // Verificar assinatura ativa
    if (requiresActiveSubscription && userProfile.subscription_status !== 'active') {
      return false;
    }

    return true;
  };

  const getAccessInfo = () => {
    if (!userProfile) {
      return {
        canAccessDashboard: false,
        canAccessPricing: false,
        needsEmailVerification: true,
        needsSubscription: true,
        currentState: null,
        redirectPath: '/auth/login'
      };
    }

    const { subscription_status } = userProfile;

    return {
      canAccessDashboard: subscription_status === 'active',
      canAccessPricing: ['pending_subscription', 'active'].includes(subscription_status),
      needsEmailVerification: subscription_status === 'pending_email',
      needsSubscription: subscription_status === 'pending_subscription',
      currentState: subscription_status,
      redirectPath: getRedirectPath(subscription_status)
    };
  };

  return { canAccess, getAccessInfo };
};

/**
 * Função helper para determinar caminho de redirecionamento
 */
function getRedirectPath(subscriptionStatus, fallback = null) {
  if (fallback) return fallback;
  
  switch (subscriptionStatus) {
    case 'pending_email':
      return '/auth/verify-email';
    case 'pending_subscription':
      return '/pricing';
    case 'active':
      return '/dashboard';
    default:
      return '/auth/login';
  }
}

/**
 * Componente de layout que mostra informações do estado atual
 */
export const StateIndicator = ({ className = '' }) => {
  const { userProfile } = useAuth();
  
  if (!userProfile) return null;

  const stateConfig = {
    pending_email: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '📧',
      message: 'Verifique seu email para continuar'
    },
    pending_subscription: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '💳',
      message: 'Escolha um plano para acessar todas as funcionalidades'
    },
    active: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅',
      message: `Plano ${userProfile.subscription_plan || 'ativo'}`
    }
  };

  const config = stateConfig[userProfile.subscription_status];
  
  if (!config) return null;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color} ${className}`}>
      <span className="mr-2">{config.icon}</span>
      {config.message}
    </div>
  );
};

export default ProtectedRoute;