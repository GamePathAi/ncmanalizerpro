import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`Webhook recebido: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription)
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Erro no webhook:', err)
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processando checkout completado:', session.id)
  
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userEmail = session.customer_email
  
  if (!userEmail) {
    console.error('Email do cliente não encontrado na sessão')
    return
  }
  
  console.log('Atualizando status de assinatura para:', { userEmail, customerId })
  
  // Usar a função update_subscription_status para atualizar o estado
  const { data, error } = await supabase
    .rpc('update_subscription_status', {
      user_email: userEmail,
      customer_id: customerId,
      status: 'active'
    })
  
  if (error) {
    console.error('Erro ao atualizar status de assinatura:', error)
  } else if (data) {
    console.log('Status de assinatura atualizado com sucesso para:', userEmail)
    
    // Atualizar campos adicionais se necessário
    await supabase
      .from('user_profiles')
      .update({
        subscription_id: subscriptionId,
        subscription_start_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', userEmail)
      
    console.log('Usuário agora tem acesso completo ao dashboard')
  } else {
    console.error('Usuário não encontrado com email:', userEmail)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Assinatura criada:', subscription.id)
  
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'active',
      subscription_id: subscription.id,
      subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('customer_id', subscription.customer)
    
  if (error) {
    console.error('Erro ao criar assinatura:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Assinatura atualizada:', subscription.id)
  
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: subscription.status,
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('subscription_id', subscription.id)
    
  if (error) {
    console.error('Erro ao atualizar assinatura:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Assinatura cancelada:', subscription.id)
  
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('subscription_id', subscription.id)
    
  if (error) {
    console.error('Erro ao cancelar assinatura:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Pagamento bem-sucedido:', invoice.id)
  
  if (invoice.subscription) {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', invoice.subscription)
      
    if (error) {
      console.error('Erro ao processar pagamento:', error)
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Falha no pagamento:', invoice.id)
  
  if (invoice.subscription) {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', invoice.subscription)
      
    if (error) {
      console.error('Erro ao processar falha de pagamento:', error)
    }
  }
}