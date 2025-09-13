import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, getCurrentUser } from '../lib/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const isDevelopment = import.meta.env.MODE === 'development';
const endpoint = isDevelopment ? 'http://localhost:54321/functions/v1/auth-endpoints' : `${supabaseUrl}/functions/v1/auth-endpoints`;
import type { UserProfile } from '../types'
import { totpService } from '../lib/totp'
import { useUserState, type UserState as UserStateType } from '../hooks/useUserState'
import type { User } from '@supabase/supabase-js'

// Estados possíveis do usuário
export type UserState = 'pending_email' | 'pending_subscription' | 'active'

// Função para determinar o estado do usuário (mantida para compatibilidade)
export const getUserState = (user: User | null, userProfile: UserProfile | null): UserState => {
  if (!user) return 'pending_email'
  
  // Se o email não foi confirmado
  if (!user.email_confirmed_at) {
    return 'pending_email'
  }
  
  // Se o email foi confirmado mas não tem assinatura ativa
  const hasActiveSubscription = userProfile?.user_state === 'active'
  if (!hasActiveSubscription) {
    return 'pending_subscription'
  }
  
  // Se tem email confirmado e assinatura ativa
  return 'active'
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  isSubscribed: boolean
  userState: UserState
  // Novos campos do sistema de estados
  userStateData: UserStateType | null
  canAccessDashboard: boolean
  needsEmailVerification: boolean
  needsSubscription: boolean
  refreshUserState: () => Promise<void>
  // Métodos de autenticação
  signUp: (email: string, password: string, fullName?: string) => Promise<any>
  signIn: (email: string, password: string, totpCode?: string) => Promise<any>
  signOut: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  resendVerificationEmail: () => Promise<void>
  // Métodos TOTP
  enableTOTP: (totpCode: string) => Promise<{ success: boolean; secret?: string; backupCodes?: string[]; error?: string }>
  disableTOTP: (totpCode: string) => Promise<{ success: boolean; error?: string }>
  validateTOTP: (totpCode: string) => Promise<{ success: boolean; error?: string }>
  generateTOTPSecret: () => Promise<{ secret: string; qrCodeUrl: string }>
  regenerateBackupCodes: () => Promise<{ success: boolean; backupCodes?: string[]; error?: string }>
  validateBackupCode: (backupCode: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [pendingTotpSecret, setPendingTotpSecret] = useState<string | null>(null)
  
  // Integrar com o novo sistema de estados
  const {
    userState: userStateData,
    loading: userStateLoading,
    canAccessDashboard,
    needsEmailVerification,
    needsSubscription,
    refreshUserState
  } = useUserState(user)
  
  // Calcular estado do usuário (compatibilidade)
  const userState = getUserState(user, userProfile)

  const refreshUserProfile = async () => {
    if (!user) {
      setUserProfile(null)
      setIsSubscribed(false)
      return
    }

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error)
        return
      }

      setUserProfile(profile)

      // Verificar status da assinatura
      const isActive = profile?.subscription_status === 'active'
      setIsSubscribed(isActive)
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) =&gt; {\n    try {\n      const registerEndpoint = 'http://localhost:3000/api/auth/register';\n      const data = { email, password, fullName };\n      console.log('Sending registration request to:', registerEndpoint);\n      console.log('Registration data:', data);\n      const response = await fetch(registerEndpoint, {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify(data),\n      });\n      console.log('Registration response status:', response.status);\n      if (!response.ok) {\n        const errorData = await response.json();\n        console.error('Registration error data:', errorData);\n        throw new Error(errorData.error || 'Erro ao cadastrar');\n      }\n      const result = await response.json();\n      console.log('Registration result:', result);\n      return { user: result.user, error: null };\n    } catch (error) {\n      console.error('Erro no cadastro:', error)\n      throw error\n    }\n  }\n
  const signIn = async (email: string, password: string, totpCode?: string) => {
    try {
      const data = { method: 'login', email, password };
      console.log('Sending login request to:', endpoint);
      console.log('Login data:', data);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      console.log('Login response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login error data:', errorData);
        throw new Error(errorData.error || 'Erro ao logar');
      }
      const result = await response.json();
      console.log('Login result:', result);
      // Configurar sessão no Supabase se necessário
      if (result.session) {
        await supabase.auth.setSession(result.session);
      }
      return { user: result.user, error: null, state: result.state };
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
      setIsSubscribed(false)
      setPendingTotpSecret(null)
    } catch (error) {
      console.error('Erro no logout:', error)
      throw error
    }
  }

  // Método para reenviar email de verificação
  const resendVerificationEmail = async () => {
    if (!user?.email) {
      throw new Error('Usuário não encontrado ou email não disponível')
    }

    try {
      const { data, error } = await supabase.functions.invoke('auth-endpoints', {
        body: {
          action: 'resend-verification'
        }
      })

      if (error) {
        throw new Error(error.message || 'Erro ao reenviar email de verificação')
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao reenviar email')
      }
    } catch (error: any) {
      console.error('Erro ao reenviar email de verificação:', error)
      throw new Error(error.message || 'Erro interno do servidor')
    }
  }

  // Métodos TOTP
  const generateTOTPSecret = async () => {
    if (!user) throw new Error('Usuário não autenticado')
    
    const { secret, qrCodeUrl } = await totpService.generateSecret(user.email || 'user', 'NCM PRO')
    setPendingTotpSecret(secret)
    return { secret, qrCodeUrl }
  }

  const enableTOTP = async (totpCode: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' }
    
    try {
      // Usar secret gerado previamente
      let secret = pendingTotpSecret
      if (!secret) {
        const gen = await generateTOTPSecret()
        secret = gen.secret
      }
      
      // Validar código fornecido
      const isValid = totpService.validateUserCode(secret!, totpCode)
      if (!isValid) {
        return { success: false, error: 'Código TOTP inválido' }
      }
      
      // Gerar códigos de backup
      const { data: backupCodes } = await supabase.rpc('generate_totp_backup_codes')
      
      // Salvar no banco
      const { error } = await supabase
        .from('user_profiles')
        .update({
          totp_secret: secret,
          totp_enabled: true,
          totp_backup_codes: backupCodes
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      await refreshUserProfile()
      setPendingTotpSecret(null)
      return { success: true, secret, backupCodes }
    } catch (error) {
      console.error('Erro ao habilitar TOTP:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  const disableTOTP = async (totpCode: string) => {
    if (!user || !userProfile) return { success: false, error: 'Usuário não autenticado' }
    
    try {
      // Validar código atual
      const isValid = totpService.validateUserCode(userProfile.totp_secret || '', totpCode)
      if (!isValid) {
        return { success: false, error: 'Código TOTP inválido' }
      }
      
      // Desabilitar TOTP
      const { error } = await supabase
        .from('user_profiles')
        .update({
          totp_enabled: false,
          totp_secret: null,
          totp_backup_codes: null
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      await refreshUserProfile()
      return { success: true }
    } catch (error) {
      console.error('Erro ao desabilitar TOTP:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  const validateTOTP = async (totpCode: string) => {
    if (!user || !userProfile) return { success: false, error: 'Usuário não autenticado' }
    
    try {
      const isValid = totpService.validateUserCode(userProfile.totp_secret || '', totpCode)
      return { success: isValid, error: isValid ? undefined : 'Código TOTP inválido' }
    } catch (error) {
      console.error('Erro ao validar TOTP:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  const regenerateBackupCodes = async () => {
    if (!user) return { success: false, error: 'Usuário não autenticado' }
    
    try {
      // Gerar novos códigos de backup
      const { data: backupCodes } = await supabase.rpc('generate_totp_backup_codes')
      
      // Atualizar no banco
      const { error } = await supabase
        .from('user_profiles')
        .update({ totp_backup_codes: backupCodes })
        .eq('id', user.id)
      
      if (error) throw error
      
      await refreshUserProfile()
      return { success: true, backupCodes }
    } catch (error) {
      console.error('Erro ao regenerar códigos de backup:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  const validateBackupCode = async (backupCode: string) => {
    if (!user || !userProfile) return { success: false, error: 'Usuário não autenticado' }
    
    try {
      const { data: isValid } = await supabase.rpc('validate_backup_code', {
        user_id: user.id,
        backup_code: backupCode
      })
      
      if (isValid) {
        await refreshUserProfile()
      }
      
      return { success: isValid, error: isValid ? undefined : 'Código de backup inválido ou já utilizado' }
    } catch (error) {
      console.error('Erro ao validar código de backup:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  useEffect(() => {
    let isMounted = true
    
    // Verificar usuário atual
    const checkCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (isMounted) {
          setUser(currentUser)
          setLoading(false)
        }
      } catch (error) {
        console.error('Erro ao verificar usuário atual:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkCurrentUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_OUT') {
          setUserProfile(null)
          setIsSubscribed(false)
        }
      }
    })

    // Verificar se há parâmetros de confirmação na URL
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    
    const token = urlParams.get('token')
    const type = urlParams.get('type')
    
    // Verificar tokens no hash (formato do Supabase)
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    
    // Verificar se é callback do Supabase (confirmação de email)
    if (accessToken && refreshToken) {
      console.log('Tokens detectados no hash, redirecionando para callback...')
      // Redirecionar para página de callback
      window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'auth/callback' } }))
    } else if (token && type === 'email_confirmation') {
      // Redirecionar para página de confirmação
      window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'email-confirmation' } }))
    }

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user) {
      refreshUserProfile()
    }
  }, [user])

  const value: AuthContextType = {
    user,
    userProfile,
    loading: loading,
    isSubscribed,
    userState,
    // Novos campos do sistema de estados
    userStateData,
    canAccessDashboard,
    needsEmailVerification,
    needsSubscription,
    refreshUserState,
    // Métodos de autenticação
    signUp,
    signIn,
    signOut,
    refreshUserProfile,
    resendVerificationEmail,
    // Métodos TOTP
    enableTOTP,
    disableTOTP,
    validateTOTP,
    generateTOTPSecret,
    regenerateBackupCodes,
    validateBackupCode
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para verificar se o usuário tem acesso
export const useSubscriptionAccess = () => {
  const { isSubscribed, loading } = useAuth()
  
  return {
    hasAccess: isSubscribed,
    loading,
    needsSubscription: !loading && !isSubscribed
  }
}