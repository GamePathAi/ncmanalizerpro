import express from 'express';
import Stripe from 'stripe';
import { verifyToken, requireEmailVerified } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import { sendSubscriptionConfirmationEmail, sendSubscriptionCancelledEmail } from '../services/emailService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Validar configuração do Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY não configurada');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.error('❌ STRIPE_WEBHOOK_SECRET não configurada');
}

// Criar sessão de checkout do Stripe
router.post('/create-checkout-session', verifyToken, requireEmailVerified, async (req, res) => {
  try {
    const { priceId, planName, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Validar dados obrigatórios
    if (!priceId || !planName || !successUrl || !cancelUrl) {
      return res.status(400).json({
        error: 'Dados obrigatórios: priceId, planName, successUrl, cancelUrl'
      });
    }

    const user = req.user;

    // Verificar se usuário está elegível para assinatura
    if (user.subscription_status !== 'pending_subscription') {
      return res.status(400).json({
        error: 'Usuário não elegível para assinatura',
        current_status: user.subscription_status
      });
    }

    let customerId = user.stripe_customer_id;

    // Criar customer no Stripe se não existir
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId,
          plan_name: planName
        }
      });
      customerId = customer.id;

      // Salvar customer_id no usuário
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Erro ao salvar customer_id:', updateError);
      }
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        plan_name: planName
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_name: planName
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });

    res.json({
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({
      error: 'Erro ao processar pagamento',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Criar portal do cliente para gerenciar assinatura
router.post('/create-portal-session', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { returnUrl } = req.body;

    const user = req.user;

    if (!user.stripe_customer_id) {
      return res.status(400).json({
        error: 'Usuário não possui customer ID'
      });
    }

    // Criar sessão do portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: returnUrl || `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({
      url: portalSession.url
    });

  } catch (error) {
    console.error('Erro ao criar portal session:', error);
    res.status(500).json({
      error: 'Erro ao acessar portal de assinatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obter informações da assinatura atual
router.get('/subscription', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = req.user;

    let subscriptionData = {
      status: user.subscription_status,
      plan: null,
      current_period_end: null,
      cancel_at_period_end: false
    };

    // Se tem customer_id e subscription_id, buscar dados no Stripe
    if (user.stripe_customer_id && user.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        const product = await stripe.products.retrieve(subscription.items.data[0].price.product);
        
        subscriptionData = {
          status: user.subscription_status,
          plan: {
            name: product.name,
            price: subscription.items.data[0].price.unit_amount / 100,
            currency: subscription.items.data[0].price.currency,
            interval: subscription.items.data[0].price.recurring.interval
          },
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end
        };
      } catch (stripeError) {
        console.error('Erro ao buscar dados no Stripe:', stripeError);
        // Continua com dados básicos do usuário
      }
    }

    res.json(subscriptionData);

  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({
      error: 'Erro ao buscar informações da assinatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Cancelar assinatura
router.post('/cancel-subscription', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cancelAtPeriodEnd = true } = req.body;

    const user = req.user;

    if (!user.stripe_subscription_id) {
      return res.status(400).json({
        error: 'Usuário não possui assinatura ativa'
      });
    }

    // Cancelar no Stripe
    const subscription = await stripe.subscriptions.update(
      user.stripe_subscription_id,
      {
        cancel_at_period_end: cancelAtPeriodEnd
      }
    );

    res.json({
      message: cancelAtPeriodEnd 
        ? 'Assinatura será cancelada no final do período atual'
        : 'Assinatura cancelada imediatamente',
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: new Date(subscription.current_period_end * 1000)
    });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({
      error: 'Erro ao cancelar assinatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Reativar assinatura cancelada
router.post('/reactivate-subscription', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = req.user;

    if (!user.stripe_subscription_id) {
      return res.status(400).json({
        error: 'Usuário não possui assinatura'
      });
    }

    // Reativar no Stripe
    const subscription = await stripe.subscriptions.update(
      user.stripe_subscription_id,
      {
        cancel_at_period_end: false
      }
    );

    res.json({
      message: 'Assinatura reativada com sucesso',
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: new Date(subscription.current_period_end * 1000)
    });

  } catch (error) {
    console.error('Erro ao reativar assinatura:', error);
    res.status(500).json({
      error: 'Erro ao reativar assinatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/stripe/webhook
 * Webhook do Stripe para eventos
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verificar assinatura do webhook
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Webhook recebido: ${event.type}`);

  try {
    // Processar evento
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
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
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`❌ Erro ao processar webhook ${event.type}:`, error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Handlers dos eventos do webhook

/**
 * Checkout session completed
 */
async function handleCheckoutCompleted(session) {
  console.log('🎉 Checkout completed:', session.id);
  
  const userId = session.metadata.user_id;
  if (!userId) {
    console.error('User ID não encontrado no metadata da sessão');
    return;
  }

  // Atualizar usuário para ativo
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      stripe_customer_id: session.customer,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Erro ao atualizar usuário após checkout:', error);
    return;
  }

  // Buscar dados do usuário para enviar email
  const { data: user } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', userId)
    .single();

  if (user) {
    try {
      await sendSubscriptionConfirmationEmail(
        user.email, 
        user.name || user.email.split('@')[0],
        session.metadata.plan_name || 'Professional'
      );
    } catch (emailError) {
      console.error('Erro ao enviar email de confirmação:', emailError);
    }
  }

  console.log(`✅ Usuário ${userId} ativado com sucesso`);
}

/**
 * Subscription created
 */
async function handleSubscriptionCreated(subscription) {
  console.log('📝 Subscription created:', subscription.id);
  
  const userId = subscription.metadata.user_id;
  if (!userId) {
    console.error('User ID não encontrado no metadata da subscription');
    return;
  }

  // Salvar subscription ID
  await supabase
    .from('users')
    .update({
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}

/**
 * Subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);
  
  let userId = subscription.metadata.user_id;
  if (!userId) {
    // Buscar usuário pelo customer ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();
    
    if (!user) {
      console.error('Usuário não encontrado para subscription:', subscription.id);
      return;
    }
    
    userId = user.id;
  }

  // Determinar status baseado na subscription
  let subscriptionStatus = 'pending_subscription';
  
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    subscriptionStatus = 'active';
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    subscriptionStatus = 'pending_subscription';
  }

  // Atualizar usuário
  await supabase
    .from('users')
    .update({
      subscription_status: subscriptionStatus,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}

/**
 * Subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Subscription deleted:', subscription.id);
  
  // Buscar usuário pelo customer ID
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (!user) {
    console.error('Usuário não encontrado para subscription cancelada:', subscription.id);
    return;
  }

  // Atualizar status para pending_subscription
  await supabase
    .from('users')
    .update({
      subscription_status: 'pending_subscription',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  // Enviar email de cancelamento
  try {
    await sendSubscriptionCancelledEmail(
      user.email,
      user.name || user.email.split('@')[0]
    );
  } catch (emailError) {
    console.error('Erro ao enviar email de cancelamento:', emailError);
  }

  console.log(`✅ Usuário ${user.id} teve assinatura cancelada`);
}

/**
 * Payment succeeded
 */
async function handlePaymentSucceeded(invoice) {
  console.log('💰 Payment succeeded:', invoice.id);
  
  // Buscar usuário pelo customer ID
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', invoice.customer)
    .single();

  if (user && user.subscription_status !== 'active') {
    // Ativar usuário se pagamento foi bem-sucedido
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
  }
}

/**
 * Payment failed
 */
async function handlePaymentFailed(invoice) {
  console.log('💸 Payment failed:', invoice.id);
  
  // Buscar usuário pelo customer ID
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', invoice.customer)
    .single();

  if (user) {
    // Aqui você pode implementar lógica para lidar com pagamento falhado
    // Por exemplo, enviar email de notificação, dar período de graça, etc.
    console.log(`⚠️ Pagamento falhou para usuário ${user.email}`);
  }
}

export default router;