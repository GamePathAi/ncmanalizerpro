import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, getCurrentUser, signUp as supabaseSignUp, signIn as supabaseSignIn } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '../types'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  isSubscribed: boolean
  signUp: (email: string, password: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  refreshUserProfile: () => Promise<void>
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
      const isActive = profile?.subscription_status === 'active' || profile?.subscription_type === 'lifetime'
      setIsSubscribed(isActive)
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const result = await supabaseSignUp(email, password)
      return result
    } catch (error) {
      console.error('Erro no cadastro:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const result = await supabaseSignIn(email, password)
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
    } catch (error) {
      console.error('Erro no logout:', error)
      throw error
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
    const token = urlParams.get('token')
    const type = urlParams.get('type')
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')
    
    // Verificar se é callback do Supabase (confirmação de email)
    if (accessToken && refreshToken && type === 'signup') {
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
    loading,
    isSubscribed,
    signUp,
    signIn,
    signOut,
    refreshUserProfile
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