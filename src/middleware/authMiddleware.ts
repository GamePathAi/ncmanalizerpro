import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserSubscriptionStatus } from '../hooks/useUserState';

// Tipos para o middleware
export interface AuthMiddlewareResult {
  success: boolean;
  user?: User;
  userState?: {
    id: string;
    email: string;
    subscription_status: UserSubscriptionStatus;
    user_state: UserSubscriptionStatus;
    email_verified_at: string | null;
    stripe_customer_id: string | null;
    can_access_dashboard: boolean;
  };
  error?: string;
  redirectTo?: 'login' | 'email-verification' | 'pricing' | 'dashboard';
}

// Configurações do middleware
export interface AuthMiddlewareConfig {
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  requireSubscription?: boolean;
  allowedStates?: UserSubscriptionStatus[];
}

/**
 * Middleware de autenticação que verifica JWT e subscription_status
 * @param token - Token JWT do usuário
 * @param config - Configurações de acesso
 * @returns Resultado da verificação
 */
export async function authMiddleware(
  token: string | null,
  config: AuthMiddlewareConfig = {}
): Promise<AuthMiddlewareResult> {
  const {
    requireAuth = true,
    requireEmailVerification = true,
    requireSubscription = false,
    allowedStates = []
  } = config;

  // Se não requer autenticação, permitir acesso
  if (!requireAuth) {
    return { success: true };
  }

  // Verificar se token foi fornecido
  if (!token) {
    return {
      success: false,
      error: 'Token de autenticação não fornecido',
      redirectTo: 'login'
    };
  }

  try {
    // Verificar JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Token inválido ou expirado',
        redirectTo: 'login'
      };
    }

    // Buscar estado do usuário no banco
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*, user_state, email_verified_at, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Se perfil não existe, criar um baseado no estado do auth.users
      if (profileError.code === 'PGRST116') {
        const newState: UserSubscriptionStatus = user.email_confirmed_at 
          ? 'pending_subscription' 
          : 'pending_email';

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            subscription_status: newState === 'active' ? 'active' : 'pending',
            user_state: newState,
            email_verified_at: user.email_confirmed_at
          })
          .select()
          .single();

        if (createError) {
          return {
            success: false,
            error: 'Erro ao criar perfil do usuário',
            redirectTo: 'login'
          };
        }

        const userState = {
          ...newProfile,
          can_access_dashboard: newProfile.user_state === 'active'
        };

        return validateUserAccess(user, userState, {
          requireEmailVerification,
          requireSubscription,
          allowedStates
        });
      }

      return {
        success: false,
        error: 'Erro ao buscar perfil do usuário',
        redirectTo: 'login'
      };
    }

    // Sincronizar status de email se necessário
    let currentProfile = userProfile;
    if (user.email_confirmed_at && userProfile.user_state === 'pending_email') {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          user_state: 'pending_subscription',
          email_verified_at: user.email_confirmed_at
        })
        .eq('id', user.id)
        .select()
        .single();

      if (!updateError && updatedProfile) {
        currentProfile = updatedProfile;
      }
    }

    const userState = {
      ...currentProfile,
      can_access_dashboard: currentProfile.user_state === 'active'
    };

    return validateUserAccess(user, userState, {
      requireEmailVerification,
      requireSubscription,
      allowedStates
    });

  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return {
      success: false,
      error: 'Erro interno do servidor',
      redirectTo: 'login'
    };
  }
}

/**
 * Valida se o usuário tem acesso baseado nas configurações
 */
function validateUserAccess(
  user: User,
  userState: any,
  config: {
    requireEmailVerification: boolean;
    requireSubscription: boolean;
    allowedStates: UserSubscriptionStatus[];
  }
): AuthMiddlewareResult {
  const { requireEmailVerification, requireSubscription, allowedStates } = config;

  // Se estados específicos são permitidos, verificar
  if (allowedStates.length > 0) {
    if (!allowedStates.includes(userState.user_state)) {
      return {
        success: false,
        error: `Acesso negado para estado: ${userState.user_state}`,
        redirectTo: getRedirectForState(userState.user_state)
      };
    }
  }

  // Verificar confirmação de email
  if (requireEmailVerification && userState.user_state === 'pending_email') {
    return {
      success: false,
      error: 'Email não confirmado',
      user,
      userState,
      redirectTo: 'email-verification'
    };
  }

  // Verificar assinatura
  if (requireSubscription && userState.user_state !== 'active') {
    return {
      success: false,
      error: 'Assinatura necessária',
      user,
      userState,
      redirectTo: 'pricing'
    };
  }

  // Acesso permitido
  return {
    success: true,
    user,
    userState
  };
}

/**
 * Determina para onde redirecionar baseado no estado do usuário
 */
function getRedirectForState(status: UserSubscriptionStatus): 'login' | 'email-verification' | 'pricing' | 'dashboard' {
  switch (status) {
    case 'pending_email':
      return 'email-verification';
    case 'pending_subscription':
      return 'pricing';
    case 'active':
      return 'dashboard';
    default:
      return 'login';
  }
}

/**
 * Hook para usar o middleware em componentes React
 */
export function useAuthMiddleware(config: AuthMiddlewareConfig = {}) {
  return async (token: string | null) => {
    return authMiddleware(token, config);
  };
}

/**
 * Configurações pré-definidas para diferentes tipos de páginas
 */
export const AuthConfigs = {
  // Páginas públicas (não requer autenticação)
  public: {
    requireAuth: false
  },
  
  // Páginas que requerem apenas login
  authenticated: {
    requireAuth: true,
    requireEmailVerification: false,
    requireSubscription: false
  },
  
  // Páginas que requerem email confirmado
  emailVerified: {
    requireAuth: true,
    requireEmailVerification: true,
    requireSubscription: false,
    allowedStates: ['pending_subscription', 'active']
  },
  
  // Páginas que requerem assinatura ativa (dashboard)
  subscribed: {
    requireAuth: true,
    requireEmailVerification: true,
    requireSubscription: true,
    allowedStates: ['active']
  },
  
  // Página de verificação de email (apenas pending_email)
  emailVerificationOnly: {
    requireAuth: true,
    requireEmailVerification: false,
    requireSubscription: false,
    allowedStates: ['pending_email']
  },
  
  // Página de pricing (apenas pending_subscription)
  pricingOnly: {
    requireAuth: true,
    requireEmailVerification: true,
    requireSubscription: false,
    allowedStates: ['pending_subscription']
  }
};