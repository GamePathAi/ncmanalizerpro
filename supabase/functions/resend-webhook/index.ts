import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WEBHOOK_SECRET = "whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo"
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Verificar assinatura do webhook
    const signature = req.headers.get('resend-signature')
    const timestamp = req.headers.get('resend-timestamp')
    
    if (!signature || !timestamp) {
      console.log('❌ Headers de assinatura ausentes')
      return new Response('Missing signature headers', { status: 400 })
    }

    const body = await req.text()
    
    // Verificar se a assinatura é válida (implementação básica)
    // Em produção, você deve implementar a verificação completa da assinatura
    if (!signature.includes('whsec_')) {
      console.log('❌ Assinatura inválida')
      return new Response('Invalid signature', { status: 401 })
    }

    const event = JSON.parse(body)
    console.log('📧 Webhook recebido:', event.type)

    // Processar diferentes tipos de eventos do Resend
    switch (event.type) {
      case 'email.sent':
        await handleEmailSent(event.data)
        break
      case 'email.delivered':
        await handleEmailDelivered(event.data)
        break
      case 'email.delivery_delayed':
        await handleEmailDelayed(event.data)
        break
      case 'email.complained':
        await handleEmailComplained(event.data)
        break
      case 'email.bounced':
        await handleEmailBounced(event.data)
        break
      case 'email.opened':
        await handleEmailOpened(event.data)
        break
      case 'email.clicked':
        await handleEmailClicked(event.data)
        break
      default:
        console.log('⚠️ Tipo de evento não reconhecido:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return new Response('Internal server error', { status: 500 })
  }
})

// Handlers para diferentes tipos de eventos
async function handleEmailSent(data: any) {
  console.log('✅ Email enviado:', data.email_id)
  
  // Atualizar status no banco de dados
  await supabase
    .from('email_logs')
    .upsert({
      email_id: data.email_id,
      email: data.to[0],
      status: 'sent',
      sent_at: new Date().toISOString(),
      subject: data.subject
    })
}

async function handleEmailDelivered(data: any) {
  console.log('📬 Email entregue:', data.email_id)
  
  await supabase
    .from('email_logs')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString()
    })
    .eq('email_id', data.email_id)
}

async function handleEmailDelayed(data: any) {
  console.log('⏰ Email atrasado:', data.email_id)
  
  await supabase
    .from('email_logs')
    .update({
      status: 'delayed',
      delayed_at: new Date().toISOString()
    })
    .eq('email_id', data.email_id)
}

async function handleEmailComplained(data: any) {
  console.log('⚠️ Reclamação de spam:', data.email_id)
  
  await supabase
    .from('email_logs')
    .update({
      status: 'complained',
      complained_at: new Date().toISOString()
    })
    .eq('email_id', data.email_id)
}

async function handleEmailBounced(data: any) {
  console.log('❌ Email rejeitado:', data.email_id)
  
  await supabase
    .from('email_logs')
    .update({
      status: 'bounced',
      bounced_at: new Date().toISOString(),
      bounce_reason: data.reason
    })
    .eq('email_id', data.email_id)
}

async function handleEmailOpened(data: any) {
  console.log('👀 Email aberto:', data.email_id)
  
  await supabase
    .from('email_logs')
    .update({
      opened_at: new Date().toISOString(),
      open_count: supabase.raw('COALESCE(open_count, 0) + 1')
    })
    .eq('email_id', data.email_id)
}

async function handleEmailClicked(data: any) {
  console.log('🔗 Link clicado:', data.email_id)
  
  await supabase
    .from('email_logs')
    .update({
      clicked_at: new Date().toISOString(),
      click_count: supabase.raw('COALESCE(click_count, 0) + 1'),
      last_clicked_url: data.link.url
    })
    .eq('email_id', data.email_id)
}