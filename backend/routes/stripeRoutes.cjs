const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../config/supabase.cjs');
const { verifyToken } = require('../middleware/authMiddleware.cjs');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting para endpoints de pagamento
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas por IP
  message: {
    error: 'Muitas tentativas de pagamento. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Criar sessão do Stripe Checkout
 */
router.post('/create-checkout-session', paymentLimiter, verifyToken, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Validar dados obrigatórios
    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({
        error: 'Dados obrigatórios: priceId, successUrl, cancelUrl'
      });
    }

    // Verificar se usuário existe e tem email verificado
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    if (userProfile.subscription_status === 'pending_email') {
      return res.status(400).json({
        error: 'Email não verificado. Verifique seu email antes de assinar.'
      });
    }

    if (userProfile.subscription_status === 'active') {
      return res.status(400).json({
        error: 'Você já possui uma assinatura ativa.'
      });
    }

    // Buscar ou criar customer no Stripe
    let customerId = userProfile.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
          source: 'ncm_analyzer_pro'
        }
      });
      
      customerId = customer.id;
      
      // Salvar customer ID no banco
      await supabase
        .from('user_profiles')
        .update({ 
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    }

    // Criar sessão do Stripe Checkout
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
        userId: userId,
        userEmail: userEmail
      },
      subscription_data: {
        metadata: {
          userId: userId,
          userEmail: userEmail
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });

    // Log da criação da sessão
    console.log(`Checkout session created: ${session.id} for user: ${userId}`);

    // Salvar log da tentativa de pagamento
    await supabase
      .from('auth_logs')
      .insert({
        user_id: userId,
        action: 'checkout_session_created',
        details: {
          session_id: session.id,
          price_id: priceId,
          customer_id: customerId
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });

    res.json({
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Erro ao criar checkout session:', error);
    
    // Log do erro
    if (req.user?.id) {
      await supabase
        .from('auth_logs')
        .insert({
          user_id: req.user.id,
          action: 'checkout_session_error',
          details: {
            error: error.message,
            stack: error.stack
          },
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          created_at: new Date().toISOString()
        });
    }

    res.status(500).json({
      error: 'Erro interno do servidor ao criar sessão de pagamento'
    });
  }
});

/**
 * Obter informações da sessão de checkout
 */
router.get('/checkout-session/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID é obrigatório'
      });
    }

    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    // Verificar se a sessão pertence ao usuário
    if (session.metadata.userId !== userId) {
      return res.status(403).json({
        error: 'Acesso negado a esta sessão'
      });
    }

    res.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_email,
      subscription: session.subscription ? {
        id: session.subscription.id,
        status: session.subscription.status,
        current_period_start: session.subscription.current_period_start,
        current_period_end: session.subscription.current_period_end
      } : null
    });

  } catch (error) {
    console.error('Erro ao buscar checkout session:', error);
    res.status(500).json({
      error: 'Erro ao buscar informações da sessão'
    });
  }
});

/**
 * Criar portal do cliente para gerenciar assinatura
 */
router.post('/create-portal-session', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { returnUrl } = req.body;

    if (!returnUrl) {
      return res.status(400).json({
        error: 'returnUrl é obrigatório'
      });
    }

    // Buscar customer ID do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    if (!userProfile.stripe_customer_id) {
      return res.status(400).json({
        error: 'Nenhuma assinatura encontrada'
      });
    }

    if (userProfile.subscription_status !== 'active') {
      return res.status(400).json({
        error: 'Assinatura não está ativa'
      });
    }

    // Criar sessão do portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userProfile.stripe_customer_id,
      return_url: returnUrl,
    });

    res.json({
      url: portalSession.url
    });

  } catch (error) {
    console.error('Erro ao criar portal session:', error);
    res.status(500).json({
      error: 'Erro ao criar sessão do portal'
    });
  }
});

/**
 * Listar preços disponíveis
 */
router.get('/prices', async (req, res) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });

    const formattedPrices = prices.data.map(price => ({
      id: price.id,
      product: {
        id: price.product.id,
        name: price.product.name,
        description: price.product.description
      },
      unit_amount: price.unit_amount,
      currency: price.currency,
      recurring: price.recurring,
      type: price.type
    }));

    res.json({
      prices: formattedPrices
    });

  } catch (error) {
    console.error('Erro ao listar preços:', error);
    res.status(500).json({
      error: 'Erro ao buscar preços'
    });
  }
});

/**
 * Obter informações da assinatura atual
 */
router.get('/subscription', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar dados do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    if (!userProfile.stripe_customer_id || userProfile.subscription_status !== 'active') {
      return res.json({
        subscription: null,
        status: userProfile.subscription_status
      });
    }

    // Buscar assinaturas ativas no Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: userProfile.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.json({
        subscription: null,
        status: 'pending_subscription'
      });
    }

    const subscription = subscriptions.data[0];
    
    res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        plan: {
          id: subscription.items.data[0].price.id,
          amount: subscription.items.data[0].price.unit_amount,
          currency: subscription.items.data[0].price.currency,
          interval: subscription.items.data[0].price.recurring.interval
        }
      },
      status: userProfile.subscription_status
    });

  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({
      error: 'Erro ao buscar informações da assinatura'
    });
  }
});

module.exports = router;