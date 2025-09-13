import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './UI/LoadingSpinner';

/**
 * Componente de rota protegida que redireciona baseado no status do usuário
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  allowedStatuses = null,
  requireSubscription = false,
  requireEmailVerified = false 
}) => {
  const { user, profile, loading, checkAuthStatus } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      if (!loading) {
        await checkAuthStatus();
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [loading]);

  // Mostrar loading enquanto verifica autenticação
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não requer autenticação, renderiza o componente
  if (!requireAuth) {
    return children;
  }

  // Se não está autenticado, redireciona para login
  if (!user || !profile) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  const { subscription_status } = profile;

  // Verificar se o status do usuário é permitido (se especificado)
  if (allowedStatuses && !allowedStatuses.includes(subscription_status)) {
    // Redirecionar baseado no status atual
    switch (subscription_status) {
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

  // Verificações específicas (compatibilidade com versão anterior)
  if (requireEmailVerified && subscription_status === 'pending_email') {
    return <Navigate to="/verify-email" replace />;
  }

  if (requireSubscription && subscription_status !== 'active') {
    return <Navigate to="/pricing" replace />;
  }

  // Lógica de redirecionamento baseada no status (compatibilidade)
  if (subscription_status === 'pending_email' && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace />;
  }

  if (subscription_status === 'pending_subscription') {
    if (requireSubscription && location.pathname !== '/pricing') {
      return <Navigate to="/pricing" replace />;
    }
    // Permitir acesso a algumas páginas básicas
    const allowedPaths = ['/pricing', '/profile', '/logout', '/dashboard'];
    if (!allowedPaths.includes(location.pathname) && requireSubscription) {
      return <Navigate to="/pricing" replace />;
    }
  }

  // Renderizar o componente se tudo estiver ok
  return children;
};

/**
 * Componente específico para usuários que precisam verificar email
 */
export const EmailVerificationRoute = ({ children }) => {
  return (
    <ProtectedRoute 
      requireAuth={true} 
      allowedStatuses={['pending_email']}
    >
      {children}
    </ProtectedRoute>
  );
};

/**
 * Componente específico para usuários que podem fazer login mas não assinaram
 */
export const PricingRoute = ({ children }) => {
  return (
    <ProtectedRoute 
      requireAuth={true} 
      allowedStatuses={['pending_subscription']}
    >
      {children}
    </ProtectedRoute>
  );
};

/**
 * Componente específico para usuários com assinatura ativa
 */
export const DashboardRoute = ({ children }) => {
  return (
    <ProtectedRoute 
      requireAuth={true} 
      allowedStatuses={['active']}
    >
      {children}
    </ProtectedRoute>
  );
};

/**
 * Componente para rotas que permitem usuários logados (email verificado)
 */
export const AuthenticatedRoute = ({ children }) => {
  return (
    <ProtectedRoute 
      requireAuth={true} 
      allowedStatuses={['pending_subscription', 'active']}
    >
      {children}
    </ProtectedRoute>
  );
};

/**
 * Componente para rotas públicas (não requer autenticação)
 */
export const PublicRoute = ({ children, redirectIfAuthenticated = false }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Se está autenticado e deve redirecionar
  if (redirectIfAuthenticated && user && profile) {
    // Redirecionar baseado no status
    switch (profile.subscription_status) {
      case 'pending_email':
        return <Navigate to="/verify-email" replace />;
      case 'pending_subscription':
        return <Navigate to="/pricing" replace />;
      case 'active':
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

/**
 * Hook para verificar se usuário tem acesso a uma funcionalidade
 */
export const useAccessControl = () => {
  const { 
    profile, 
    getUserStatus, 
    isEmailVerified, 
    hasActiveSubscription,
    canAccessDashboard 
  } = useAuth();

  const hasAccess = (requiredStatus) => {
    if (!profile) return false;
    
    switch (requiredStatus) {
      case 'email_verified':
        return isEmailVerified();
      case 'active_subscription':
        return hasActiveSubscription;
      case 'any_authenticated':
        return ['pending_email', 'pending_subscription', 'active'].includes(getUserStatus());
      default:
        return false;
    }
  };

  const getRedirectPath = () => {
    if (!profile) return '/login';
    
    switch (getUserStatus()) {
      case 'pending_email':
        return '/verify-email';
      case 'pending_subscription':
        return '/pricing';
      case 'active':
        return '/dashboard';
      default:
        return '/login';
    }
  };

  return {
    hasAccess,
    getRedirectPath,
    userStatus: getUserStatus(),
    isEmailVerified: isEmailVerified(),
    hasActiveSubscription: hasActiveSubscription,
    canAccessDashboard: canAccessDashboard()
  };
};

/**
 * Hook para verificar permissões (compatibilidade com versão anterior)
 */
export const usePermissions = () => {
  const { 
    canAccessDashboard,
    isEmailVerified,
    hasActiveSubscription,
    needsEmailVerification,
    needsSubscription
  } = useAuth();

  const permissions = {
    canAccessDashboard: canAccessDashboard(),
    canAccessPricing: isEmailVerified(),
    needsEmailVerification: needsEmailVerification(),
    needsSubscription: needsSubscription(),
    hasActiveSubscription: hasActiveSubscription
  };

  return permissions;
};

/**
 * Componente para mostrar conteúdo baseado em permissões
 */
export const ConditionalRender = ({ 
  children, 
  requireSubscription = false, 
  requireEmailVerified = false,
  fallback = null 
}) => {
  const permissions = usePermissions();

  // Verificar se precisa de email verificado
  if (requireEmailVerified && permissions.needsEmailVerification) {
    return fallback;
  }

  // Verificar se precisa de assinatura
  if (requireSubscription && !permissions.hasActiveSubscription) {
    return fallback;
  }

  return children;
};

/**
 * Componente de redirecionamento automático baseado no status
 */
export const StatusBasedRedirect = () => {
  const { getRedirectPath } = useAccessControl();
  const redirectPath = getRedirectPath();
  
  return <Navigate to={redirectPath} replace />;
};

/**
 * Componente para redirecionar baseado no estado do usuário (compatibilidade)
 */
export const StateBasedRedirect = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Redirecionar baseado no estado
  switch (profile.subscription_status) {
    case 'pending_email':
      return <Navigate to="/verify-email" replace />;
    case 'pending_subscription':
      return <Navigate to="/pricing" replace />;
    case 'active':
      return <Navigate to="/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;