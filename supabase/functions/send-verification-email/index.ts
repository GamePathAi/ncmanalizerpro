import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  email: string
  confirmationUrl: string
  userName?: string
}

// Template HTML para email de verificação
const getEmailTemplate = (confirmationUrl: string, userName?: string) => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirme seu email - NCM Pro</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .alternative-link {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            word-break: break-all;
            font-size: 14px;
            color: #374151;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .security-notice {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .title {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">NCM Pro</div>
            <h1 class="title">Confirme seu email</h1>
            <p class="subtitle">
                ${userName ? `Olá ${userName}!` : 'Olá!'} Bem-vindo ao NCM Pro. Para começar a usar nossa plataforma, confirme seu endereço de email.
            </p>
        </div>
        
        <div class="content">
            <p>Clique no botão abaixo para confirmar seu email e ativar sua conta:</p>
            
            <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">Confirmar Email</a>
            </div>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <div class="alternative-link">
                ${confirmationUrl}
            </div>
            
            <div class="security-notice">
                <strong>⚠️ Importante:</strong> Este link expira em 24 horas por motivos de segurança. Se você não solicitou esta confirmação, pode ignorar este email.
            </div>
            
            <p><strong>Próximos passos após a confirmação:</strong></p>
            <ol>
                <li>Faça login na sua conta</li>
                <li>Escolha um plano de assinatura</li>
                <li>Comece a classificar seus NCMs automaticamente</li>
            </ol>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado pelo NCM Pro</p>
            <p>Se você não criou uma conta conosco, pode ignorar este email.</p>
            <p>
                <a href="mailto:suporte@ncmpro.com" style="color: #2563eb;">Precisa de ajuda?</a> |
                <a href="https://ncmpro.com/privacidade" style="color: #2563eb;">Política de Privacidade</a>
            </p>
        </div>
    </div>
</body>
</html>
  `
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { email, confirmationUrl, userName }: EmailRequest = await req.json()

    // Validar dados obrigatórios
    if (!email || !confirmationUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, confirmationUrl' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Configurar Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Preparar dados do email
    const emailData = {
      from: 'NCM Pro <noreply@ncmpro.com>',
      to: [email],
      subject: 'Confirme seu email - NCM Pro',
      html: getEmailTemplate(confirmationUrl, userName),
      text: `
Olá${userName ? ` ${userName}` : ''}!

Bem-vindo ao NCM Pro. Para começar a usar nossa plataforma, confirme seu endereço de email.

Clique no link abaixo para confirmar:
${confirmationUrl}

Este link expira em 24 horas por motivos de segurança.

Se você não solicitou esta confirmação, pode ignorar este email.

Precisa de ajuda? Entre em contato: suporte@ncmpro.com

Equipe NCM Pro
      `.trim()
    }

    // Enviar email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API error:', errorData)
      throw new Error(`Failed to send email: ${errorData.message || response.statusText}`)
    }

    const result = await response.json()
    console.log('Email sent successfully:', result.id)

    // Log do envio (opcional - para auditoria)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Registrar log de email enviado
    await supabaseClient
      .from('email_logs')
      .insert({
        email_to: email,
        email_type: 'email_verification',
        resend_id: result.id,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .catch(error => {
        console.warn('Failed to log email send:', error)
        // Não falhar a operação se o log falhar
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Verification email sent successfully',
        emailId: result.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('Error sending verification email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send verification email',
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})