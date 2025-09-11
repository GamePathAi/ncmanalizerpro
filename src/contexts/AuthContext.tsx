import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, getCurrentUser, signUp as supabaseSignUp, signIn as supabaseSignIn } from '../lib/supabase'
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
  const hasActiveSubscription = userProfile?.subscription_status === 'active'
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

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const result = await supabaseSignUp(email, password, fullName)
      return result
    } catch (error) {
      console.error('Erro no cadastro:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string, totpCode?: string) => {
    try {
      const result = await supabaseSignIn(email, password)
      
      // Se login básico foi bem-sucedido, verificar perfil do usuário
      if (result.user && !result.error) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('totp_enabled, subscription_status, subscription_type')
          .eq('id', result.user.id)
          .single()
        
        // Verificar se o email foi confirmado
        if (!result.user.email_confirmed_at) {
          await supabase.auth.signOut()
          return { 
            user: null, 
            error: { 
              message: 'EMAIL_NOT_CONFIRMED', 
              requiresEmailConfirmation: true,
              details: 'Você precisa confirmar seu email antes de fazer login. Verifique sua caixa de entrada.'
            }
          }
        }
        
        // Se TOTP está habilitado mas código não foi fornecido
        if (profile?.totp_enabled && !totpCode) {
          // Fazer logout temporário
          await supabase.auth.signOut()
          return { 
            user: null, 
            error: { message: 'TOTP_REQUIRED', requiresTOTP: true }
          }
        }
        
        // Se TOTP está habilitado e código foi fornecido, validar
        if (profile?.totp_enabled && totpCode) {
          const totpValidation = await validateTOTP(totpCode)
          if (!totpValidation.success) {
            // Fazer logout se TOTP inválido
            await supabase.auth.signOut()
            return { 
              user: null, 
              error: { message: 'Código TOTP inválido' }
            }
          }
        }
      }
      
      return result
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
    // Verificar usuário atual
    const checkCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        setLoading(false)
      } catch (error) {
        console.error('Erro ao verificar usuário atual:', error)
        setLoading(false)
      }
    }

    checkCurrentUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (event === 'SIGNED_OUT') {
        setUserProfile(null)
        setIsSubscribed(false)
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

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      refreshUserProfile()
    }
  }, [user])

  const value: AuthContextType = {
    user,
    userProfile,
    loading: loading || userStateLoading,
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