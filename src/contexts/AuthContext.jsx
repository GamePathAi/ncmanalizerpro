import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.ts';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Verificar status de autenticação
  const checkAuthStatus = async () => {
    try {
      // Verificar primeiro se há autenticação local
      const localToken = localStorage.getItem('auth_token');
      const localEmail = localStorage.getItem('user_email');
      const localStatus = localStorage.getItem('user_status');
      
      if (localToken && localEmail && localStatus) {
        // Usar autenticação local
        const mockUser = {
          id: 'local_user_' + Date.now(),
          email: localEmail,
          email_confirmed_at: new Date().toISOString()
        };
        
        const mockProfile = {
          id: mockUser.id,
          email: localEmail,
          full_name: 'Usuário Teste',
          subscription_status: localStatus,
          subscription_plan: 'premium',
          subscription_expires_at: null
        };
        
        setUser(mockUser);
        setProfile(mockProfile);
        setSession({ user: mockUser, access_token: localToken });
        setLoading(false);
        return;
      }
      
      // Fallback para Supabase se não houver autenticação local
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao verificar sessão:', error);
        setUser(null);
        setProfile(null);
        setSession(null);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        setSession(session);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  // Buscar perfil do usuário
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 significa que não há perfil - isso é normal para usuários novos
        if (error.code === 'PGRST116') {
          console.log('Perfil não encontrado para usuário:', userId);
          setProfile(null);
          return;
        }
        
        console.error('Erro ao buscar perfil:', error);
        setProfile(null);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setProfile(null);
    }
  };

  // Fazer login
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      setUser(data.user);
      setSession(data.session);
      await fetchUserProfile(data.user.id);

      return { success: true, data };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fazer cadastro
  const signUp = async (email, password, fullName = 'Usuário') => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) {
        throw error;
      }

      // Criar perfil diretamente (não depender do trigger)
      if (data.user) {
        try {
          const profileData = {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
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

      return { success: true, data };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fazer logout
  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      setUser(null);
      setProfile(null);
      setSession(null);

      return { success: true };
    } catch (error) {
      console.error('Erro no logout:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Verificar email
  const verifyEmail = async (token) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao verificar email');
      }

      // Atualizar perfil após verificação
      if (user) {
        await fetchUserProfile(user.id);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Erro na verificação de email:', error);
      return { success: false, error: error.message };
    }
  };

  // Função para verificar status do usuário
  const getUserStatus = () => {
    if (!user) return 'unauthenticated';
    return profile?.subscription_status || 'pending_email';
  };

  // Funções de verificação de estado
  const isEmailVerified = () => {
    return profile && profile.subscription_status !== 'pending_email';
  };

  const canAccessDashboard = () => {
    return profile?.subscription_status === 'active';
  };

  const needsEmailVerification = () => {
    return profile?.subscription_status === 'pending_email';
  };

  const needsSubscription = () => {
    return profile?.subscription_status === 'pending_subscription';
  };

  // Reenviar email de verificação
  const resendVerification = async (email) => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao reenviar email');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Erro ao reenviar verificação:', error);
      return { success: false, error: error.message };
    }
  };

  // Atualizar perfil
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { success: false, error: error.message };
    }
  };

  // Obter token de acesso
  const getAccessToken = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      return session.access_token;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  };

  // Verificar se tem permissão
  const hasPermission = (permission) => {
    if (!profile) return false;

    switch (permission) {
      case 'dashboard':
        return profile.subscription_status === 'active';
      case 'pricing':
        return profile.subscription_status !== 'pending_email';
      case 'email_verified':
        return profile.subscription_status !== 'pending_email';
      default:
        return false;
    }
  };

  // Escutar mudanças de autenticação
  useEffect(() => {
    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setSession(session);
          await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setSession(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setSession(session);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    verifyEmail,
    resendVerification,
    updateProfile,
    checkAuthStatus,
    getAccessToken,
    hasPermission,
    getUserStatus,
    isEmailVerified,
    canAccessDashboard,
    needsEmailVerification,
    needsSubscription,
    // Estados derivados
    isAuthenticated: !!user,
    hasActiveSubscription: profile?.subscription_status === 'active',
    subscriptionStatus: profile?.subscription_status || null,
    userStatus: getUserStatus()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;