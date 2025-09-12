import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { AuthGuard } from './AuthGuard'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmailVerificationPage } from '../../pages/EmailVerificationPage'
import { PricingPage } from '../../pages/PricingPage'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresAuth?: boolean
  requiresEmailVerification?: boolean
  requiresSubscription?: boolean
  redirectTo?: string
}

// Componente principal de roteamento protegido
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAuth = true,
  requiresEmailVerification = true,
  requiresSubscription = true,
  redirectTo = '/auth/login'
}) => {
  const { user, userState, loading } = useAuth()
  const location = useLocation()

  // Mostrar loading enquanto carrega
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Se não requer autenticação, renderizar diretamente
  if (!requiresAuth) {
    return <>{children}</>
  }

  // Se não está logado, redirecionar para login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Se não tem estado do usuário, mostrar erro
  if (!userState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar perfil
          </h2>
          <p className="text-gray-600 mb-4">
            Não foi possível carregar suas informações. Tente fazer login novamente.
          </p>
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Fazer Login
          </button>
        </div>
      </div>
    )
  }

  // Verificar estado do usuário e redirecionar conforme necessário
  switch (userState.user_state) {
    case 'pending_email':
      // Se está na página de verificação de email, permitir acesso
      if (location.pathname === '/auth/verify-email') {
        return <>{children}</>
      }
      // Caso contrário, redirecionar para verificação
      return <EmailVerificationPage />

    case 'pending_subscription':
      // Se não requer assinatura, permitir acesso
      if (!requiresSubscription) {
        return <>{children}</>
      }
      // Se está na página de pricing, permitir acesso
      if (location.pathname === '/pricing') {
        return <>{children}</>
      }
      // Caso contrário, redirecionar para pricing
      return <PricingPage />

    case 'active':
      // Usuário ativo pode acessar tudo
      return <>{children}</>

    default:
      // Estado desconhecido, redirecionar para login
      return <Navigate to={redirectTo} state={{ from: location }} replace />
  }
}

// Componente específico para rotas que requerem apenas login
export const LoginRequiredRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute
      requiresAuth={true}
      requiresEmailVerification={false}
      requiresSubscription={false}
    >
      {children}
    </ProtectedRoute>
  )
}

// Componente específico para rotas que requerem email verificado
export const EmailVerifiedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute
      requiresAuth={true}
      requiresEmailVerification={true}
      requiresSubscription={false}
    >
      {children}
    </ProtectedRoute>
  )
}

// Componente específico para rotas que requerem assinatura ativa
export const SubscriptionRequiredRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute
      requiresAuth={true}
      requiresEmailVerification={true}
      requiresSubscription={true}
    >
      {children}
    </ProtectedRoute>
  )
}

// Componente para rotas públicas (não logado)
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Se está logado, redirecionar para dashboard
  if (user) {
    const from = (location.state as any)?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}

// Hook para verificar permissões programaticamente
export const useRoutePermissions = () => {
  const { user, userState, loading } = useAuth()

  const canAccess = {
    // Pode acessar rotas públicas
    public: true,
    
    // Pode acessar rotas que requerem login
    authenticated: !!user,
    
    // Pode acessar rotas que requerem email verificado
    emailVerified: !!user && userState?.user_state !== 'pending_email',
    
    // Pode acessar rotas que requerem assinatura
    subscription: !!user && userState?.user_state === 'active',
    
    // Pode acessar o dashboard completo
    dashboard: !!user && userState?.user_state === 'active'
  }

  const redirectPath = {
    // Para onde redirecionar baseado no estado atual
    getRedirectPath: () => {
      if (!user) return '/auth/login'
      if (userState?.user_state === 'pending_email') return '/auth/verify-email'
      if (userState?.user_state === 'pending_subscription') return '/pricing'
      return '/dashboard'
    }
  }

  return {
    canAccess,
    redirectPath,
    loading,
    user,
    userState
  }
}

// Componente de layout que mostra diferentes conteúdos baseado no estado
export const StateBasedLayout: React.FC<{
  pendingEmail?: React.ReactNode
  pendingSubscription?: React.ReactNode
  active?: React.ReactNode
  loading?: React.ReactNode
}> = ({
  pendingEmail,
  pendingSubscription,
  active,
  loading: loadingComponent
}) => {
  const { user, userState, loading } = useAuth()

  if (loading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  switch (userState?.user_state) {
    case 'pending_email':
      return <>{pendingEmail || <EmailVerificationPage />}</>
    
    case 'pending_subscription':
      return <>{pendingSubscription || <PricingPage />}</>
    
    case 'active':
      return <>{active}</>
    
    default:
      return <Navigate to="/auth/login" replace />
  }
}