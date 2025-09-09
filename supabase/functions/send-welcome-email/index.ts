import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  email: string
  name: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name }: EmailRequest = await req.json()

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'Email e nome são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Aqui você pode integrar com seu provedor de email preferido
    // Exemplo com Resend (você precisa configurar a API key)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY não configurada, simulando envio de email')
      console.log(`Email de boas-vindas seria enviado para: ${email} (${name})`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email simulado enviado com sucesso',
          email,
          name 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Enviar email usando Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NCM Analyzer Pro <noreply@seudominio.com>',
        to: [email],
        subject: 'Bem-vindo ao NCM Analyzer Pro! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Bem-vindo ao NCM Analyzer Pro</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo ao NCM Analyzer Pro!</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <h2 style="color: #495057; margin-top: 0;">Olá, ${name}! 👋</h2>
              
              <p style="font-size: 16px; margin-bottom: 20px;">Obrigado por se cadastrar no <strong>NCM Analyzer Pro</strong>! Estamos muito felizes em tê-lo conosco.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <h3 style="color: #667eea; margin-top: 0;">🚀 O que você pode fazer agora:</h3>
                <ul style="padding-left: 20px;">
                  <li>Analisar códigos NCM de forma inteligente</li>
                  <li>Obter oportunidades de negócio personalizadas</li>
                  <li>Acessar relatórios detalhados de mercado</li>
                  <li>Utilizar nossa IA para insights avançados</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://seudominio.com/login" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Começar Agora</a>
              </div>
              
              <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">Se você tiver alguma dúvida, não hesite em nos contatar. Estamos aqui para ajudar!</p>
              
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
              
              <p style="font-size: 12px; color: #6c757d; text-align: center;">NCM Analyzer Pro - Sua ferramenta inteligente para análise de códigos NCM</p>
            </div>
          </body>
          </html>
        `
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Erro ao enviar email:', errorData)
      throw new Error('Falha ao enviar email')
    }

    const emailData = await emailResponse.json()
    console.log('Email enviado com sucesso:', emailData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de boas-vindas enviado com sucesso!',
        emailId: emailData.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na função send-welcome-email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})