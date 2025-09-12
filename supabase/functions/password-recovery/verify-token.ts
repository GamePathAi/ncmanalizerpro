import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token não fornecido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar token na tabela password_reset_tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (tokenError || !tokenData) {
      console.log('Token não encontrado:', tokenError)
      return new Response(
        JSON.stringify({ valid: false, error: 'Token inválido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se token não expirou (24 horas)
    const tokenCreatedAt = new Date(tokenData.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - tokenCreatedAt.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 24) {
      console.log('Token expirado:', hoursDiff, 'horas')
      return new Response(
        JSON.stringify({ valid: false, error: 'Token expirado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar email do usuário
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(tokenData.user_id)

    if (userError || !userData.user) {
      console.log('Usuário não encontrado:', userError)
      return new Response(
        JSON.stringify({ valid: false, error: 'Usuário não encontrado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        valid: true, 
        email: userData.user.email,
        user_id: tokenData.user_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro ao verificar token:', error)
    return new Response(
      JSON.stringify({ valid: false, error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})