import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_cUYtKFVN_PKKTwpTDy81aaDFZNWKmwYsz'
const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'

interface ForgotPasswordRequest {
  email: string
}

interface ResetPasswordRequest {
  token: string
  password: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const url = new URL(req.url)
    const method = req.method
    const body = method === 'POST' ? await req.json() : null

    // Determinar ação baseada no path
    const path = url.pathname.split('/').pop()

    switch (path) {
      case 'test-env':
        return new Response(
          JSON.stringify({
            resend_api_key: resendApiKey ? 'SET' : 'NOT SET',
            site_url: siteUrl,
            frontend_url: frontendUrl,
            supabase_url: supabaseUrl,
            timestamp: new Date().toISOString()
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      
      case 'verify-token':
        if (method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await handleVerifyToken(supabase, body)
      
      case 'reset-password':
        if (method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await handleResetPassword(supabase, body as ResetPasswordRequest)
      
      case 'forgot-password':
      default:
        if (method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return handleForgotPassword(supabase, body as ForgotPasswordRequest)
    }
  } catch (error) {
    console.error('Error in password-recovery:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// POST /forgot-password - Solicita recuperação de senha
async function handleForgotPassword(supabase: any, body: ForgotPasswordRequest) {
  try {
    console.log('🔍 handleForgotPassword iniciado')
    console.log('Body recebido:', JSON.stringify(body))
    
    if (!body?.email) {
      console.log('❌ Email não fornecido')
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email } = body
    console.log('📧 Email a processar:', email)

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Formato de email inválido')
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Verificando se usuário existe...')
    // Verificar se o usuário existe
    const { data: users, error: userError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    if (userError) {
      console.log('❌ Erro ao buscar usuários:', userError)
      return new Response(
        JSON.stringify({ 
          message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.',
          success: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      console.log('⚠️ Usuário não encontrado, retornando sucesso por segurança')
      // Por segurança, sempre retornamos sucesso mesmo se o email não existir
      return new Response(
        JSON.stringify({ 
          message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.',
          success: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('✅ Usuário encontrado:', user.id)

    // Verificar rate limiting (máximo 3 tentativas por hora)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: recentAttempts, error: countError } = await supabase
      .from('password_reset_tokens')
      .select('id')
      .eq('email', email)
      .gte('created_at', oneHourAgo)
    
    if (countError) {
      console.error('Error checking rate limit:', countError)
    } else if (recentAttempts && recentAttempts.length >= 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Muitas tentativas. Tente novamente em 1 hora.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gerar token seguro
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Salvar token no banco
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.user.id,
        email: email,
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    if (tokenError) {
      console.error('Error saving reset token:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enviar email de recuperação
    const resetUrl = `${siteUrl}/reset-password?token=${token}`
    const emailSent = await sendPasswordResetEmail(email, resetUrl, user.user.user_metadata?.full_name || email.split('@')[0])

    if (!emailSent) {
      return new Response(
        JSON.stringify({ error: 'Failed to send reset email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.',
        success: true 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleForgotPassword:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// POST /reset-password - Redefine a senha usando token
async function handleResetPassword(supabase: any, body: ResetPasswordRequest) {
  try {
    if (!body?.token || !body?.password) {
      return new Response(
        JSON.stringify({ error: 'Token and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { token, password } = body

    // Validar senha
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar e validar token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se token não expirou
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Token expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atualizar senha do usuário
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: password }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Marcar token como usado
    await supabase
      .from('password_reset_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token)

    return new Response(
      JSON.stringify({ 
        message: 'Senha redefinida com sucesso',
        success: true 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleResetPassword:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// POST /verify-token - Verifica se token é válido
async function handleVerifyToken(supabase: any, body: any) {
  try {
    if (!body?.token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { token } = body

    // Buscar token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token inválido' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se token não expirou
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token expirado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        valid: true,
        email: tokenData.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleVerifyToken:', error)
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Função para enviar email de recuperação de senha
async function sendPasswordResetEmail(email: string, resetUrl: string, userName: string): Promise<boolean> {
  try {
    const emailHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir Senha - NCM Analyzer Pro</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔐 Redefinir Senha</h1>
            <p>NCM Analyzer Pro</p>
        </div>
        
        <div class="content">
            <h2>Olá, ${userName}!</h2>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>NCM Analyzer Pro</strong>.</p>
            
            <p>Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
            </div>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">${resetUrl}</p>
            
            <div class="warning">
                <p><strong>⚠️ Importante:</strong></p>
                <ul>
                    <li>Este link expira em <strong>1 hora</strong></li>
                    <li>Se você não solicitou esta redefinição, ignore este email</li>
                    <li>Sua senha atual permanecerá inalterada até que você complete o processo</li>
                </ul>
            </div>
            
            <p>Se você não conseguir clicar no botão, copie e cole o link completo no seu navegador.</p>
            
            <p>Precisa de ajuda? Entre em contato conosco respondendo este email.</p>
            
            <p>Atenciosamente,<br><strong>Equipe NCM Analyzer Pro</strong></p>
        </div>
        
        <div class="footer">
            <p>Este é um email automático, não responda.</p>
            <p>© 2025 NCM Analyzer Pro. Todos os direitos reservados.</p>
        </div>
    </body>
    </html>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'NCM Analyzer Pro <noreply@gamepathai.com>',
        to: [email],
        subject: '🔐 Redefinir Senha - NCM Analyzer Pro',
        html: emailHtml
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Resend API error:', errorData)
      return false
    }

    console.log('Password reset email sent successfully to:', email)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}