import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface UserState {
  id: string
  email: string
  subscription_status: 'pending_email' | 'pending_subscription' | 'active'
  email_verified_at: string | null
  stripe_customer_id: string | null
  can_access_dashboard: boolean
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (path) {
      case 'me':
        return handleGetUserState(supabase, user.id)
      
      case 'resend-verification':
        return handleResendVerification(supabase, user)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in auth-endpoints:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// GET /auth/me - Retorna estado atual do usuário
async function handleGetUserState(supabase: any, userId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_user_state', { user_id: userId })
    
    if (error) {
      console.error('Error getting user state:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to get user state' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userState = data[0] as UserState
    
    if (!userState) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        user: {
          id: userState.id,
          email: userState.email,
          subscription_status: userState.subscription_status,
          email_verified_at: userState.email_verified_at,
          stripe_customer_id: userState.stripe_customer_id
        },
        state: {
          canAccessDashboard: userState.can_access_dashboard,
          needsEmailVerification: userState.subscription_status === 'pending_email',
          needsSubscription: userState.subscription_status === 'pending_subscription'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleGetUserState:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// POST /auth/resend-verification - Reenvia email de verificação
async function handleResendVerification(supabase: any, user: any) {
  try {
    // Verificar se o usuário já confirmou o email
    if (user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ error: 'Email already verified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar rate limiting (máximo 3 por hora)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: recentEmails, error: countError } = await supabase
      .from('email_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('email_type', 'email_confirmation')
      .gte('created_at', oneHourAgo)
    
    if (countError) {
      console.error('Error checking email rate limit:', countError)
    } else if (recentEmails && recentEmails.length >= 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Maximum 3 emails per hour.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Reenviar email de confirmação
    const { error: resendError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: user.email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL')}/auth/callback`
      }
    })

    if (resendError) {
      console.error('Error resending verification email:', resendError)
      return new Response(
        JSON.stringify({ error: 'Failed to resend verification email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log do email enviado
    await supabase
      .from('email_logs')
      .insert({
        user_id: user.id,
        email_type: 'email_confirmation',
        email_address: user.email,
        status: 'sent'
      })

    return new Response(
      JSON.stringify({ 
        message: 'Verification email sent successfully',
        success: true 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleResendVerification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}