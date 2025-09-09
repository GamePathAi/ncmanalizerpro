import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConfirmationEmailRequest {
  email: string
  name?: string
  confirmation_url: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, confirmation_url }: ConfirmationEmailRequest = await req.json()

    // Validar dados de entrada
    if (!email || !confirmation_url) {
      return new Response(
        JSON.stringify({ error: 'Email e URL de confirmação são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Configurações do email
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@ncmanalyzerpro.com'
    const FROM_NAME = Deno.env.get('FROM_NAME') || 'NCM Analyzer Pro'
    const APP_URL = Deno.env.get('APP_URL') || 'https://ncmanalyzerpro.com'

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'Configuração de email não encontrada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Template do email de confirmação
    const emailHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu email - NCM Analyzer Pro</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 10px;
            }
            .title {
                color: #1f2937;
                font-size: 24px;
                margin-bottom: 20px;
            }
            .content {
                color: #4b5563;
                font-size: 16px;
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 20px 0;
                transition: transform 0.2s;
            }
            .button:hover {
                transform: translateY(-2px);
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
            }
            .warning {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #92400e;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🚗 NCM Analyzer Pro</div>
                <h1 class="title">Confirme seu email</h1>
            </div>
            
            <div class="content">
                <p>Olá${name ? ` ${name}` : ''}!</p>
                
                <p>Obrigado por se cadastrar no <strong>NCM Analyzer Pro</strong>! Para completar seu cadastro e começar a economizar milhares de reais em suas importações automotivas, você precisa confirmar seu endereço de email.</p>
                
                <div style="text-align: center;">
                    <a href="${confirmation_url}" class="button">
                        ✅ Confirmar Email
                    </a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong> Este link expira em 24 horas. Se você não confirmar seu email dentro deste prazo, será necessário solicitar um novo link de confirmação.
                </div>
                
                <p>Se você não se cadastrou no NCM Analyzer Pro, pode ignorar este email com segurança.</p>
                
                <p><strong>Por que confirmar seu email?</strong></p>
                <ul>
                    <li>🔒 Garantir a segurança da sua conta</li>
                    <li>📧 Receber atualizações importantes sobre NCMs</li>
                    <li>🎯 Acessar recursos exclusivos da plataforma</li>
                    <li>💰 Começar a economizar em suas importações</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                <p style="word-break: break-all; color: #3b82f6;">${confirmation_url}</p>
                
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                
                <p>Este email foi enviado para <strong>${email}</strong></p>
                <p>NCM Analyzer Pro - Sua ferramenta definitiva para análise de NCMs automotivos</p>
                <p>© 2024 NCM Analyzer Pro. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `

    // Enviar email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: '🚗 Confirme seu email - NCM Analyzer Pro',
        html: emailHtml,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Erro ao enviar email:', errorData)
      return new Response(
        JSON.stringify({ error: 'Falha ao enviar email de confirmação' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailData = await emailResponse.json()
    console.log('Email de confirmação enviado:', emailData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de confirmação enviado com sucesso',
        email_id: emailData.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})