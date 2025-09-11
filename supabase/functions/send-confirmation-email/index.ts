import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'POST') {
    try {
      const { email, confirmationUrl, userId } = await req.json()
      
      if (!email || !confirmationUrl) {
        return new Response(
          JSON.stringify({ error: 'Email and confirmationUrl are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      // Template de email profissional
      const emailTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirme seu Email - NCM Pro</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">NCM Pro</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Confirme seu email para continuar</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Bem-vindo ao NCM Pro!</h2>
              
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                Obrigado por se cadastrar! Para ativar sua conta e começar a usar nossa plataforma, 
                você precisa confirmar seu endereço de email.
              </p>
              
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                Clique no botão abaixo para confirmar seu email:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                          color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; 
                          font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                  Confirmar Email
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
                <a href="${confirmationUrl}" style="color: #3b82f6; word-break: break-all;">${confirmationUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0;">
                Se você não criou uma conta no NCM Pro, pode ignorar este email com segurança.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 NCM Pro. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
      
      const emailData = {
        from: 'NCM Analyzer Pro <onboarding@resend.dev>',
        to: [email],
        subject: '✅ Confirme seu email - NCM Analyzer Pro',
        html: emailTemplate
      }
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('Erro ao enviar email:', result)
        return new Response(
          JSON.stringify({ error: 'Failed to send email', details: result }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Log do email enviado
      if (userId) {
        await supabase
          .from('email_logs')
          .insert({
            user_id: userId,
            email_type: 'email_confirmation',
            email_address: email,
            status: 'sent',
            resend_id: result.id
          })
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          id: result.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Error sending confirmation email:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})