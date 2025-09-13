import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserSubscriptionStatus = 'pending_email' | 'pending_subscription' | 'active';

export interface UserState {
  id: string;
  email: string;
  subscription_status: UserSubscriptionStatus;
  user_state: UserSubscriptionStatus;
  email_verified_at: string | null;
  stripe_customer_id: string | null;
  can_access_dashboard: boolean;
}

export interface UseUserStateReturn {
  userState: UserState | null;
  loading: boolean;
  error: string | null;
  refreshUserState: () => Promise<void>;
  canAccessDashboard: boolean;
  needsEmailVerification: boolean;
  needsSubscription: boolean;
}

export function useUserState(user: User | null): UseUserStateReturn {
  const [userState, setUserState] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserState = async () => {
    if (!user) {
      setUserState(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Primeiro, verificar se o perfil existe
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Se o perfil não existe, criar um
        if (profileError.code === 'PGRST116') {
          console.log('Criando perfil para usuário:', user.email);
          
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              subscription_status: user.email_confirmed_at ? 'pending_subscription' : 'pending_email',
              user_state: user.email_confirmed_at ? 'pending_subscription' : 'pending_email',
              email_verified_at: user.email_confirmed_at
            })
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          setUserState({
            ...newProfile,
            can_access_dashboard: newProfile.user_state === 'active'
          });
        } else {
          throw profileError;
        }
      } else {
        // Atualizar status baseado no auth.users se necessário
        let updatedProfile = profile;
        
        // Verificar se precisa atualizar status de subscription baseado na confirmação de email
        if (user.email_confirmed_at && profile.user_state === 'pending_email') {
          const { data: updated, error: updateError } = await supabase
            .from('user_profiles')
            .update({
              subscription_status: 'pending_subscription',
              user_state: 'pending_subscription'
            })
            .eq('id', user.id)
            .select()
            .single();

          if (updateError) {
            console.error('Erro ao atualizar perfil:', updateError);
          } else {
            updatedProfile = updated;
          }
        }

        setUserState({
          ...updatedProfile,
          can_access_dashboard: updatedProfile.user_state === 'active'
        });
      }
    } catch (err) {
      console.error('Erro ao buscar estado do usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserState();
  }, [user?.id, user?.email_confirmed_at]);

  const refreshUserState = async () => {
    await fetchUserState();
  };

  const canAccessDashboard = userState?.user_state === 'active';
  const needsEmailVerification = userState?.user_state === 'pending_email';
  const needsSubscription = userState?.user_state === 'pending_subscription';

  return {
    userState,
    loading,
    error,
    refreshUserState,
    canAccessDashboard,
    needsEmailVerification,
    needsSubscription
  };
}