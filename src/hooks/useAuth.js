import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { supabase } from '../lib/supabase.ts';

// Contexto de autenticação
const AuthContext = createContext({});

/**
 * Provider de autenticação com estados de usuário
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar estado de autenticação
  const checkAuthState = useCallback(async () => {
    try {
      setError(null);
      
      // Verificar sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        setError('Erro ao verificar autenticação');
        setUser(null);
        setUserProfile(null);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        
        // Buscar perfil do usuário com estado de assinatura
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select(`
            *,
            subscription_status,
            subscription_plan,
            subscription_expires_at,
            stripe_customer_id
          `)
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
          // Se não encontrar perfil, criar um básico
          if (profileError.code === 'PGRST116') {
            await createUserProfile(session.user);
          } else {
            setError('Erro ao carregar dados do usuário');
          }
        } else {
          setUserProfile(profile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Erro inesperado ao verificar auth:', err);
      setError('Erro inesperado de autenticação');
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar perfil de usuário básico
  const createUserProfile = async (user) => {
    try {
      const profileData = {
        id: user.id,
        email: user.email,
        subscription_status: user.email_confirmed_at ? 'pending_subscription' : 'pending_email',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar perfil:', error);
        setError('Erro ao criar perfil de usuário');
      } else {
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Erro ao criar perfil:', err);
      setError('Erro ao criar perfil de usuário');
    }
  };

  // Fazer login
  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      // Verificar estado após login
      await checkAuthState();
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = 'Erro inesperado ao fazer login';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Fazer cadastro
  const signUp = async (email, password, metadata = {}) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      // Criar perfil diretamente (não depender do trigger)
      if (data.user) {
        try {
          const profileData = {
            id: data.user.id,
            email: data.user.email,
            full_name: metadata.full_name || 'Usuário',
            subscription_type: 'free',
            subscription_status: data.user.email_confirmed_at ? 'pending_subscription' : 'pending_email',
            totp_enabled: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert(profileData);

          if (profileError) {
            console.warn('Aviso: Erro ao criar perfil:', profileError.message);
            // Não falhar o cadastro por causa do perfil
          }
        } catch (profileErr) {
          console.warn('Aviso: Exceção ao criar perfil:', profileErr.message);
          // Não falhar o cadastro por causa do perfil
        }
      }

      return { 
        success: true, 
        data,
        needsEmailVerification: !data.user?.email_confirmed_at
      };
    } catch (err) {
      const errorMsg = 'Erro inesperado ao criar conta';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Fazer logout
  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      setUser(null);
      setUserProfile(null);
      
      return { success: true };
    } catch (err) {
      const errorMsg = 'Erro ao fazer logout';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Reenviar email de verificação
  const resendVerification = async () => {
    try {
      setError(null);
      
      if (!user?.email) {
        setError('Email não encontrado');
        return { success: false, error: 'Email não encontrado' };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMsg = 'Erro ao reenviar email';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Redefinir senha
  const resetPassword = async (email) => {
    try {
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMsg = 'Erro ao enviar email de redefinição';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Atualizar perfil
  const updateProfile = async (updates) => {
    try {
      setError(null);
      
      if (!user?.id) {
        setError('Usuário não autenticado');
        return { success: false, error: 'Usuário não autenticado' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      setUserProfile(data);
      return { success: true, data };
    } catch (err) {
      const errorMsg = 'Erro ao atualizar perfil';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Verificar se tem acesso a funcionalidade
  const hasAccess = useCallback((requirement) => {
    if (!userProfile) return false;

    switch (requirement) {
      case 'email_verified':
        return userProfile.subscription_status !== 'pending_email';
      case 'active_subscription':
        return userProfile.subscription_status === 'active';
      case 'dashboard':
        return userProfile.subscription_status === 'active';
      case 'pricing':
        return ['pending_subscription', 'active'].includes(userProfile.subscription_status);
      default:
        return true;
    }
  }, [userProfile]);

  // Obter informações do estado atual
  const getStateInfo = useCallback(() => {
    if (!userProfile) {
      return {
        state: null,
        canAccessDashboard: false,
        needsEmailVerification: true,
        needsSubscription: true,
        message: 'Faça login para continuar'
      };
    }

    const { subscription_status } = userProfile;

    const stateInfo = {
      pending_email: {
        state: 'pending_email',
        canAccessDashboard: false,
        needsEmailVerification: true,
        needsSubscription: true,
        message: 'Verifique seu email para continuar',
        nextStep: 'Verificar email',
        nextAction: '/auth/verify-email'
      },
      pending_subscription: {
        state: 'pending_subscription',
        canAccessDashboard: false,
        needsEmailVerification: false,
        needsSubscription: true,
        message: 'Escolha um plano para acessar o dashboard',
        nextStep: 'Escolher plano',
        nextAction: '/pricing'
      },
      active: {
        state: 'active',
        canAccessDashboard: true,
        needsEmailVerification: false,
        needsSubscription: false,
        message: `Plano ${userProfile.subscription_plan || 'ativo'}`,
        nextStep: 'Acessar dashboard',
        nextAction: '/dashboard'
      }
    };

    return stateInfo[subscription_status] || stateInfo.pending_email;
  }, [userProfile]);

  // Listener para mudanças de autenticação
  useEffect(() => {
    // Verificar estado inicial
    checkAuthState();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await checkAuthState();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [checkAuthState]);

  const value = {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resendVerification,
    resetPassword,
    updateProfile,
    checkAuthState,
    hasAccess,
    getStateInfo,
    // Estados derivados
    isAuthenticated: !!user,
    isEmailVerified: userProfile?.subscription_status !== 'pending_email',
    hasActiveSubscription: userProfile?.subscription_status === 'active',
    subscriptionStatus: userProfile?.subscription_status || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar o contexto de autenticação
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};

export default useAuth;