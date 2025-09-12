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
    const { token, password } = await req.json()

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: 'Token e senha são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
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
        JSON.stringify({ error: 'Token inválido ou já utilizado' }),
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
        JSON.stringify({ error: 'Token expirado. Solicite um novo link de recuperação.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Atualizar senha do usuário
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: password }
    )

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar senha. Tente novamente.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Marcar token como usado
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token)

    if (markUsedError) {
      console.error('Erro ao marcar token como usado:', markUsedError)
      // Não retornar erro aqui pois a senha já foi alterada
    }

    console.log('Senha redefinida com sucesso para usuário:', tokenData.user_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senha redefinida com sucesso! Você pode fazer login com sua nova senha.' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})