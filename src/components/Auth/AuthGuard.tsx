import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authMiddleware, type AuthMiddlewareConfig, type AuthMiddlewareResult } from '../../middleware/authMiddleware';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { EmailVerificationPage } from '../Pages/EmailVerificationPage';
import { PricingPage } from '../Pages/PricingPage';

interface AuthGuardProps {
  children: React.ReactNode;
  config?: AuthMiddlewareConfig;
  fallback?: React.ReactNode;
  onUnauthorized?: (result: AuthMiddlewareResult) => void;
}

/**
 * Componente que protege rotas usando o middleware de autenticação
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  config = {},
  fallback,
  onUnauthorized
}) => {
  const { user, loading: authLoading } = useAuth();
  const [middlewareResult, setMiddlewareResult] = useState<AuthMiddlewareResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      
      try {
        // Obter token do usuário atual
        const token = user?.access_token || null;
        
        // Executar middleware
        const result = await authMiddleware(token, config);
        setMiddlewareResult(result);
        
        // Chamar callback se não autorizado
        if (!result.success && onUnauthorized) {
          onUnauthorized(result);
        }
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        setMiddlewareResult({
          success: false,
          error: 'Erro interno',
          redirectTo: 'login'
        });
      } finally {
        setLoading(false);
      }
    };

    // Só verificar quando não estiver carregando auth
    if (!authLoading) {
      checkAccess();
    }
  }, [user, authLoading, config, onUnauthorized]);

  // Mostrar loading enquanto verifica
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Se não há resultado ainda, mostrar loading
  if (!middlewareResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Se acesso permitido, renderizar children
  if (middlewareResult.success) {
    return <>{children}</>;
  }

  // Se há fallback customizado, usar ele
  if (fallback) {
    return <>{fallback}</>;
  }

  // Renderizar página baseada no redirectTo
  switch (middlewareResult.redirectTo) {
    case 'email-verification':
      return <EmailVerificationPage />;
    
    case 'pricing':
      return <PricingPage />;
    
    case 'login':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8 p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Acesso Restrito
              </h2>
              <p className="text-gray-600 mb-6">
                {middlewareResult.error || 'Você precisa estar logado para acessar esta página.'}
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
    
    case 'dashboard':
      // Não deveria acontecer, mas redirecionar para dashboard se necessário
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Redirecionando...</h2>
            <LoadingSpinner size="lg" />
          </div>
        </div>
      );
    
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-md w-full space-y-8 p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-red-900 mb-4">
                Erro de Acesso
              </h2>
              <p className="text-red-600 mb-6">
                {middlewareResult.error || 'Erro desconhecido ao verificar permissões.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      );
  }
};

/**
 * Hook para usar o AuthGuard programaticamente
 */
export function useAuthGuard(config: AuthMiddlewareConfig = {}) {
  const { user } = useAuth();
  const [result, setResult] = useState<AuthMiddlewareResult | null>(null);
  const [loading, setLoading] = useState(false);

  const checkAccess = async () => {
    setLoading(true);
    try {
      const token = user?.access_token || null;
      const middlewareResult = await authMiddleware(token, config);
      setResult(middlewareResult);
      return middlewareResult;
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      const errorResult: AuthMiddlewareResult = {
        success: false,
        error: 'Erro interno',
        redirectTo: 'login'
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setLoading(false);
    }
  };

  return {
    result,
    loading,
    checkAccess,
    hasAccess: result?.success || false,
    canAccessDashboard: result?.userState?.can_access_dashboard || false,
    needsEmailVerification: result?.redirectTo === 'email-verification',
    needsSubscription: result?.redirectTo === 'pricing'
  };
}

/**
 * Componentes pré-configurados para diferentes tipos de proteção
 */

// Proteção para páginas que requerem apenas login
export const AuthenticatedGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard config={{ requireAuth: true, requireEmailVerification: false, requireSubscription: false }}>
    {children}
  </AuthGuard>
);

// Proteção para páginas que requerem email confirmado
export const EmailVerifiedGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard config={{ requireAuth: true, requireEmailVerification: true, requireSubscription: false }}>
    {children}
  </AuthGuard>
);

// Proteção para páginas que requerem assinatura (dashboard)
export const SubscriptionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard config={{ requireAuth: true, requireEmailVerification: true, requireSubscription: true }}>
    {children}
  </AuthGuard>
);

// Proteção específica para página de verificação de email
export const EmailVerificationGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard config={{ requireAuth: true, allowedStates: ['pending_email'] }}>
    {children}
  </AuthGuard>
);

// Proteção específica para página de pricing
export const PricingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard config={{ requireAuth: true, requireEmailVerification: true, allowedStates: ['pending_subscription'] }}>
    {children}
  </AuthGuard>
);