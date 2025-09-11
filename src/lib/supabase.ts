import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, Subscription } from '../types'

// Configuração do Supabase
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://placeholder.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-anon-key'

// Aviso útil se as variáveis não estiverem configuradas corretamente
if (
  !import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.NEXT_PUBLIC_SUPABASE_URL
) {
  // eslint-disable-next-line no-console
  console.error(
    '[Supabase] Variáveis de ambiente ausentes: defina VITE_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL no .env.'
  )
}
if (
  !import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  // eslint-disable-next-line no-console
  console.error(
    '[Supabase] Variáveis de ambiente ausentes: defina VITE_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-exportar tipos
export type { UserProfile, Subscription }

// Funções de autenticação
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signUp = async (email: string, password: string, fullName?: string): Promise<{ user: User | null; error: any }> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email
      }
    }
  })
  return { user: data.user, error }
}

export const signIn = async (email: string, password: string): Promise<{ user: User | null; error: any }> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data.user, error }
}

// Serviços (mantidos para compatibilidade)
export const auth = {
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password })
  },
  
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  },
  
  signOut: async () => {
    return await supabase.auth.signOut()
  },
  
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },
  
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const userService = {
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  },
  
  updateUserProfile: async (userId: string, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    return { data, error }
  },
  
  checkSubscriptionStatus: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_status, plan_type, expires_at')
      .eq('id', userId)
      .single()
    
    if (error) return { isActive: false, error }
    
    const isActive = data.subscription_status === 'active' && 
      (data.plan_type === 'lifetime' || 
       (data.expires_at && new Date(data.expires_at) > new Date()))
    
    return { isActive, data, error: null }
  }
}

export const subscriptionService = {
  createSubscription: async (subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single()
    
    return { data, error }
  },
  
  updateSubscription: async (subscriptionId: string, updates: Partial<Subscription>) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', subscriptionId)
      .select()
      .single()
    
    return { data, error }
  },
  
  getSubscriptionByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    return { data, error }
  }
}