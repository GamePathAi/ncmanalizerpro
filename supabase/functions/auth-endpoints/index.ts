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

    // Handle different HTTP methods and paths
    const method = req.method
    
    // For POST requests without auth (register, login, verify-email)
    if (method === 'POST' && !authHeader) {
      const body = await req.json()
      
      switch (body.method) {
        case 'register':
          return handleRegister(supabase, body)
        
        case 'login':
          return handleLogin(supabase, body)
        
        case 'verify-email':
          return handleVerifyEmail(supabase, body)
        
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid method' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    }
    
    // For authenticated endpoints
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

// POST /auth/register - Registra novo usuário
async function handleRegister(supabase: any, body: any) {
  try {
    const { email, password, fullName } = body
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName || email
      },
      email_confirm: false // Requer confirmação de email
    })
    
    if (error) {
      console.error('Error creating user:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Enviar email de verificação
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL')}/auth/callback`
      }
    })
    
    if (emailError) {
      console.error('Error sending verification email:', emailError)
    }
    
    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email,
          email_confirmed_at: data.user?.email_confirmed_at
        },
        message: 'Usuário criado. Verifique seu email para confirmar a conta.'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleRegister:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// POST /auth/login - Faz login do usuário
async function handleLogin(supabase: any, body: any) {
  try {
    const { email, password } = body
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Error signing in:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Verificar se o email foi confirmado
    if (!data.user?.email_confirmed_at) {
      return new Response(
        JSON.stringify({ 
          error: 'Email not confirmed',
          requiresEmailConfirmation: true,
          message: 'Você precisa confirmar seu email antes de fazer login. Verifique sua caixa de entrada.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Buscar estado do usuário
    const { data: userState } = await supabase
      .rpc('get_user_state', { user_id: data.user.id })
    
    const state = userState?.[0]
    
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        },
        state: {
          subscription_status: state?.subscription_status || 'pending_subscription',
          canAccessDashboard: state?.can_access_dashboard || false,
          needsSubscription: (state?.subscription_status || 'pending_subscription') === 'pending_subscription'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleLogin:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// POST /auth/verify-email - Verifica email do usuário
async function handleVerifyEmail(supabase: any, body: any) {
  try {
    const { token, type } = body
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Verificar token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type || 'signup'
    })
    
    if (error) {
      console.error('Error verifying email:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or expired token',
          message: 'O token de verificação é inválido ou expirou. Solicite um novo email de confirmação.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Atualizar perfil do usuário para pending_subscription
    if (data.user) {
      await supabase
        .from('user_profiles')
        .update({ 
          email_verified_at: new Date().toISOString(),
          user_state: 'pending_subscription'
        })
        .eq('id', data.user.id)
    }
    
    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email,
          email_confirmed_at: data.user?.email_confirmed_at
        },
        message: 'Email confirmado com sucesso! Agora você pode fazer login.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleVerifyEmail:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

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