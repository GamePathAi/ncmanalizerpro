const express = require('express');
const Stripe = require('stripe');
const { supabase } = require('../config/supabase');
const { sendSubscriptionConfirmationEmail, sendSubscriptionCancelledEmail } = require('../services/emailService');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware para verificar assinatura do webhook
const verifyWebhookSignature = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  req.stripeEvent = event;
  next();
};

// Webhook principal do Stripe
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), verifyWebhookSignature, async (req, res) => {
  const event = req.stripeEvent;

  console.log(`🔔 Webhook recebido: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object);
        break;

      default:
        console.log(`🤷‍♂️ Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Handlers dos eventos do Stripe

/**
 * Checkout session completed - primeira assinatura
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('✅ Processando checkout session completed:', session.id);

  const userId = session.metadata?.user_id;
  const planName = session.metadata?.plan_name;
  const customerId = session.customer;

  if (!userId) {
    console.error('❌ User ID não encontrado nos metadados da sessão');
    return;
  }

  try {
    // Buscar usuário no banco
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ Usuário não encontrado:', userId, userError);
      return;
    }

    // Buscar a assinatura criada
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    const subscription = subscriptions.data[0];
    
    if (!subscription) {
      console.error('❌ Assinatura não encontrada para customer:', customerId);
      return;
    }

    // Atualizar usuário no banco
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_plan_id: subscription.items.data[0].price.id,
        subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError);
      return;
    }

    // Enviar email de confirmação
    try {
      await sendSubscriptionConfirmationEmail(user.email, user.name || user.email.split('@')[0], planName || 'Premium');
      console.log('📧 Email de confirmação enviado para:', user.email);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de confirmação:', emailError);
    }

    // Log de auditoria
    console.log(`🎉 Assinatura ativada com sucesso para usuário ${user.email} (ID: ${userId})`);

  } catch (error) {
    console.error('❌ Erro ao processar checkout completed:', error);
  }
}

/**
 * Subscription created
 */
async function handleSubscriptionCreated(subscription) {
  console.log('🆕 Processando subscription created:', subscription.id);

  const customerId = subscription.customer;

  try {
    // Buscar usuário pelo customer ID
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !user) {
      console.error('❌ Usuário não encontrado para customer:', customerId);
      return;
    }

    // Atualizar dados da assinatura
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        stripe_subscription_id: subscription.id,
        subscription_plan_id: subscription.items.data[0].price.id,
        subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar assinatura:', updateError);
      return;
    }

    console.log(`✅ Assinatura criada para usuário ${user.email}`);

  } catch (error) {
    console.error('❌ Erro ao processar subscription created:', error);
  }
}

/**
 * Subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Processando subscription updated:', subscription.id);

  const customerId = subscription.customer;
  const status = subscription.status;

  try {
    // Buscar usuário pelo customer ID
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !user) {
      console.error('❌ Usuário não encontrado para customer:', customerId);
      return;
    }

    // Mapear status do Stripe para nosso sistema
    let subscriptionStatus = 'pending_subscription';
    
    if (status === 'active') {
      subscriptionStatus = 'active';
    } else if (['canceled', 'unpaid', 'past_due'].includes(status)) {
      subscriptionStatus = 'pending_subscription';
    }

    // Preparar dados de atualização
    const updateData = {
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString()
    };

    // Se a assinatura está ativa, atualizar dados do período
    if (status === 'active') {
      updateData.subscription_plan_id = subscription.items.data[0].price.id;
      updateData.subscription_current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
      updateData.subscription_current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
    }

    // Atualizar usuário
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar status da assinatura:', updateError);
      return;
    }

    console.log(`🔄 Status da assinatura atualizado: ${user.email} -> ${subscriptionStatus}`);

  } catch (error) {
    console.error('❌ Erro ao processar subscription updated:', error);
  }
}

/**
 * Subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Processando subscription deleted:', subscription.id);

  const customerId = subscription.customer;

  try {
    // Buscar usuário pelo customer ID
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !user) {
      console.error('❌ Usuário não encontrado para customer:', customerId);
      return;
    }

    // Atualizar status para pending_subscription
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'pending_subscription',
        stripe_subscription_id: null,
        subscription_plan_id: null,
        subscription_current_period_start: null,
        subscription_current_period_end: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Erro ao cancelar assinatura:', updateError);
      return;
    }

    // Enviar email de cancelamento
    try {
      await sendSubscriptionCancelledEmail(user.email, user.name || user.email.split('@')[0]);
      console.log('📧 Email de cancelamento enviado para:', user.email);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de cancelamento:', emailError);
    }

    console.log(`❌ Assinatura cancelada para usuário ${user.email}`);

  } catch (error) {
    console.error('❌ Erro ao processar subscription deleted:', error);
  }
}

/**
 * Invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('💰 Processando invoice payment succeeded:', invoice.id);

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    console.log('ℹ️ Invoice não relacionado a assinatura, ignorando');
    return;
  }

  try {
    // Buscar usuário pelo customer ID
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !user) {
      console.error('❌ Usuário não encontrado para customer:', customerId);
      return;
    }

    // Garantir que o status está ativo
    if (user.subscription_status !== 'active') {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Erro ao ativar assinatura após pagamento:', updateError);
      } else {
        console.log(`✅ Assinatura reativada após pagamento: ${user.email}`);
      }
    }

    console.log(`💰 Pagamento processado com sucesso para ${user.email}`);

  } catch (error) {
    console.error('❌ Erro ao processar invoice payment succeeded:', error);
  }
}

/**
 * Invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice) {
  console.log('💳 Processando invoice payment failed:', invoice.id);

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    console.log('ℹ️ Invoice não relacionado a assinatura, ignorando');
    return;
  }

  try {
    // Buscar usuário pelo customer ID
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !user) {
      console.error('❌ Usuário não encontrado para customer:', customerId);
      return;
    }

    // Aqui você pode implementar lógica adicional para falhas de pagamento
    // Por exemplo: enviar email de notificação, suspender acesso após X tentativas, etc.
    
    console.log(`💳 Falha no pagamento para usuário ${user.email}`);
    
    // TODO: Implementar notificação por email sobre falha no pagamento
    // TODO: Implementar lógica de suspensão após múltiplas falhas

  } catch (error) {
    console.error('❌ Erro ao processar invoice payment failed:', error);
  }
}

/**
 * Trial will end
 */
async function handleTrialWillEnd(subscription) {
  console.log('⏰ Processando trial will end:', subscription.id);

  const customerId = subscription.customer;

  try {
    // Buscar usuário pelo customer ID
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !user) {
      console.error('❌ Usuário não encontrado para customer:', customerId);
      return;
    }

    // TODO: Enviar email notificando que o trial está acabando
    console.log(`⏰ Trial acabando em breve para usuário ${user.email}`);

  } catch (error) {
    console.error('❌ Erro ao processar trial will end:', error);
  }
}

/**
 * Payment method attached
 */
async function handlePaymentMethodAttached(paymentMethod) {
  console.log('💳 Processando payment method attached:', paymentMethod.id);

  const customerId = paymentMethod.customer;

  try {
    // Buscar usuário pelo customer ID
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !user) {
      console.error('❌ Usuário não encontrado para customer:', customerId);
      return;
    }

    console.log(`💳 Método de pagamento adicionado para usuário ${user.email}`);

  } catch (error) {
    console.error('❌ Erro ao processar payment method attached:', error);
  }
}

/**
 * Função utilitária para logs estruturados
 */
function logWebhookEvent(eventType, data, status = 'success', error = null) {
  const logData = {
    timestamp: new Date().toISOString(),
    event_type: eventType,
    status,
    data: {
      customer_id: data.customer,
      subscription_id: data.id,
      amount: data.amount_total || data.amount_paid,
      currency: data.currency
    }
  };

  if (error) {
    logData.error = error.message;
  }

  console.log('📊 Webhook Log:', JSON.stringify(logData, null, 2));
}

module.exports = router;