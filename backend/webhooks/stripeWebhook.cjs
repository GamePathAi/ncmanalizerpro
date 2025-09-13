const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Configurações do Supabase não encontradas');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Endpoint secret do Stripe
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// =====================================================
// WEBHOOK DO STRIPE PARA ATUALIZAR SUBSCRIPTION_STATUS
// =====================================================

/**
 * Middleware para verificar assinatura do webhook
 */
const verifyStripeSignature = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    req.stripeEvent = event;
    next();
  } catch (err) {
    console.error('Erro na verificação da assinatura do webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

/**
 * Função para log de eventos do webhook
 */
async function logWebhookEvent(eventType, success, metadata = {}) {
  try {
    await supabaseAdmin
      .from('auth_logs')
      .insert({
        event_type: `stripe_${eventType}`,
        success,
        metadata,
        user_id: metadata.user_id || null
      });
  } catch (error) {
    console.error('Erro ao registrar log do webhook:', error);
  }
}

/**
 * Função para ativar assinatura do usuário
 */
async function activateUserSubscription(customerEmail, stripeCustomerId, subscriptionId, planType = 'basic') {
  try {
    // Usar função do banco para ativar assinatura
    const { data, error } = await supabaseAdmin
      .rpc('activate_user_subscription', {
        user_email: customerEmail,
        stripe_customer_id_param: stripeCustomerId,
        stripe_subscription_id_param: subscriptionId,
        subscription_plan_param: planType
      });

    if (error) {
      throw new Error(`Erro na função do banco: ${error.message}`);
    }

    const result = data;

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log(`✅ Assinatura ativada para ${customerEmail}:`, {
      user_id: result.user_id,
      plan: result.plan,
      subscription_status: result.subscription_status
    });

    return result;
  } catch (error) {
    console.error('❌ Erro ao ativar assinatura:', error);
    throw error;
  }
}

/**
 * Função para desativar assinatura do usuário
 */
async function deactivateUserSubscription(stripeCustomerId, reason = 'cancelled') {
  try {
    // Buscar usuário pelo stripe_customer_id
    const { data: userProfile, error: findError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();

    if (findError || !userProfile) {
      throw new Error('Usuário não encontrado para o customer_id do Stripe');
    }

    // Atualizar status para pending_subscription
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_status: 'pending_subscription',
        subscription_expires_at: new Date().toISOString()
      })
      .eq('id', userProfile.id);

    if (updateError) {
      throw new Error(`Erro ao atualizar perfil: ${updateError.message}`);
    }

    // Log do evento
    await logWebhookEvent('subscription_deactivated', true, {
      user_id: userProfile.id,
      email: userProfile.email,
      reason,
      stripe_customer_id: stripeCustomerId
    });

    console.log(`⚠️ Assinatura desativada para ${userProfile.email}:`, {
      user_id: userProfile.id,
      reason
    });

    return { success: true, user_id: userProfile.id };
  } catch (error) {
    console.error('❌ Erro ao desativar assinatura:', error);
    throw error;
  }
}

/**
 * Determinar tipo de plano baseado no preço ou produto
 */
function determinePlanType(priceId, amount) {
  // Mapear price_ids para planos (configurar conforme seus produtos no Stripe)
  const priceToPlans = {
    // Substitua pelos seus price_ids reais do Stripe
    'price_basic_monthly': 'basic',
    'price_basic_yearly': 'basic',
    'price_pro_monthly': 'pro',
    'price_pro_yearly': 'pro',
    'price_enterprise_monthly': 'enterprise',
    'price_enterprise_yearly': 'enterprise'
  };

  // Tentar mapear por price_id primeiro
  if (priceToPlans[priceId]) {
    return priceToPlans[priceId];
  }

  // Fallback: mapear por valor (em centavos)
  if (amount <= 2990) return 'basic';      // até R$ 29,90
  if (amount <= 5990) return 'pro';        // até R$ 59,90
  return 'enterprise';                     // acima de R$ 59,90
}

// =====================================================
// HANDLERS DOS EVENTOS DO STRIPE
// =====================================================

/**
 * Handler para checkout.session.completed
 * Quando usuário completa o pagamento
 */
async function handleCheckoutCompleted(session) {
  try {
    console.log('🎯 Processando checkout.session.completed:', session.id);

    const customerEmail = session.customer_details?.email || session.customer_email;
    const stripeCustomerId = session.customer;
    const subscriptionId = session.subscription;

    if (!customerEmail) {
      throw new Error('Email do cliente não encontrado na sessão');
    }

    // Buscar detalhes da assinatura
    let planType = 'basic';
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price?.id;
      const amount = subscription.items.data[0]?.price?.unit_amount;
      
      planType = determinePlanType(priceId, amount);
    }

    // Ativar assinatura
    const result = await activateUserSubscription(
      customerEmail,
      stripeCustomerId,
      subscriptionId,
      planType
    );

    await logWebhookEvent('checkout_completed', true, {
      user_id: result.user_id,
      email: customerEmail,
      plan: planType,
      session_id: session.id,
      subscription_id: subscriptionId
    });

    return { success: true, user_id: result.user_id };
  } catch (error) {
    await logWebhookEvent('checkout_completed', false, {
      error: error.message,
      session_id: session.id
    });
    throw error;
  }
}

/**
 * Handler para customer.subscription.deleted
 * Quando assinatura é cancelada
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('🚫 Processando customer.subscription.deleted:', subscription.id);

    const result = await deactivateUserSubscription(
      subscription.customer,
      'subscription_cancelled'
    );

    return result;
  } catch (error) {
    await logWebhookEvent('subscription_deleted', false, {
      error: error.message,
      subscription_id: subscription.id
    });
    throw error;
  }
}

/**
 * Handler para invoice.payment_failed
 * Quando pagamento falha
 */
async function handlePaymentFailed(invoice) {
  try {
    console.log('💳 Processando invoice.payment_failed:', invoice.id);

    // Se for a terceira tentativa falhada, desativar assinatura
    if (invoice.attempt_count >= 3) {
      const result = await deactivateUserSubscription(
        invoice.customer,
        'payment_failed_multiple_attempts'
      );
      
      return result;
    }

    // Log do evento sem desativar ainda
    await logWebhookEvent('payment_failed', true, {
      invoice_id: invoice.id,
      attempt_count: invoice.attempt_count,
      customer_id: invoice.customer
    });

    return { success: true, action: 'logged_only' };
  } catch (error) {
    await logWebhookEvent('payment_failed', false, {
      error: error.message,
      invoice_id: invoice.id
    });
    throw error;
  }
}

// =====================================================
// ROTA PRINCIPAL DO WEBHOOK
// =====================================================

/**
 * @route POST /webhooks/stripe
 * @desc Webhook do Stripe para eventos de assinatura
 * @access Stripe only
 */
router.post('/stripe', express.raw({ type: 'application/json' }), verifyStripeSignature, async (req, res) => {
  const event = req.stripeEvent;

  console.log(`📨 Webhook recebido: ${event.type}`);

  try {
    let result;

    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        // Tratar atualizações de assinatura (upgrade/downgrade)
        console.log('📝 Subscription updated:', event.data.object.id);
        result = { success: true, action: 'subscription_updated' };
        break;

      case 'invoice.payment_succeeded':
        // Pagamento bem-sucedido (renovação)
        console.log('✅ Payment succeeded:', event.data.object.id);
        result = { success: true, action: 'payment_succeeded' };
        break;

      case 'invoice.payment_failed':
        result = await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`⚠️ Evento não tratado: ${event.type}`);
        result = { success: true, action: 'event_not_handled' };
    }

    console.log(`✅ Webhook processado com sucesso:`, result);
    res.json({ received: true, result });

  } catch (error) {
    console.error(`❌ Erro no webhook ${event.type}:`, error);
    
    // Retornar erro 500 para que o Stripe tente novamente
    res.status(500).json({
      error: 'Erro interno no processamento do webhook',
      event_type: event.type,
      event_id: event.id
    });
  }
});

/**
 * @route GET /webhooks/stripe/test
 * @desc Endpoint para testar configuração do webhook
 * @access Private (apenas para desenvolvimento)
 */
router.get('/stripe/test', async (req, res) => {
  try {
    // Verificar configurações
    const config = {
      stripe_configured: !!process.env.STRIPE_SECRET_KEY,
      webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
      supabase_configured: !!(supabaseUrl && supabaseServiceKey)
    };

    // Testar conexão com Supabase
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('count')
      .limit(1);

    config.supabase_connection = !error;

    res.json({
      success: true,
      message: 'Configuração do webhook Stripe',
      config,
      webhook_url: `${process.env.APP_URL}/webhooks/stripe`,
      events_to_listen: [
        'checkout.session.completed',
        'customer.subscription.deleted',
        'customer.subscription.updated',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao verificar configuração',
      details: error.message
    });
  }
});

module.exports = router;