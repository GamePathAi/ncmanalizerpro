import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware para verificar assinatura do webhook do Stripe
 */
const verifyStripeSignature = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    console.error('Webhook signature ou endpoint secret não configurado');
    return res.status(400).json({ error: 'Assinatura do webhook ausente' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    req.stripeEvent = event;
    next();
  } catch (err) {
    console.error('Erro na verificação da assinatura do webhook:', err.message);
    return res.status(400).json({ error: 'Assinatura inválida' });
  }
};

/**
 * POST /webhook/stripe
 * Webhook do Stripe para processar eventos de pagamento
 */
router.post('/stripe', express.raw({ type: 'application/json' }), verifyStripeSignature, async (req, res) => {
  try {
    const event = req.stripeEvent;
    
    console.log('Evento do Stripe recebido:', event.type);

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
    console.error('Erro no webhook do Stripe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Processar checkout concluído
 */
async function handleCheckoutCompleted(session) {
  try {
    console.log('Processando checkout concluído:', session.id);
    
    const customerId = session.customer;
    const customerEmail = session.customer_details?.email;
    
    if (!customerId && !customerEmail) {
      throw new Error('Customer ID ou email não encontrado na sessão');
    }

    // Buscar usuário pelo email ou customer_id
    let query = supabase.from('users').select('*');
    
    if (customerId) {
      query = query.eq('stripe_customer_id', customerId);
    } else {
      query = query.eq('email', customerEmail);
    }
    
    const { data: users, error } = await query;
    
    if (error || !users || users.length === 0) {
      console.error('Usuário não encontrado para o checkout:', { customerId, customerEmail });
      return;
    }

    const user = users[0];

    // Atualizar status para ativo
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`Usuário ${user.email} ativado com sucesso`);
    
    // Log da ativação
    await logSubscriptionEvent(user.id, 'activated', {
      session_id: session.id,
      customer_id: customerId,
      amount: session.amount_total
    });
    
  } catch (error) {
    console.error('Erro ao processar checkout concluído:', error);
    throw error;
  }
}

/**
 * Processar criação de assinatura
 */
async function handleSubscriptionCreated(subscription) {
  try {
    console.log('Processando assinatura criada:', subscription.id);
    
    const customerId = subscription.customer;
    
    // Buscar usuário pelo customer_id
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId);
    
    if (error || !users || users.length === 0) {
      console.error('Usuário não encontrado para a assinatura:', customerId);
      return;
    }

    const user = users[0];

    // Atualizar status se ainda não estiver ativo
    if (user.subscription_status !== 'active') {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`Usuário ${user.email} ativado via assinatura`);
    }
    
    await logSubscriptionEvent(user.id, 'subscription_created', {
      subscription_id: subscription.id,
      status: subscription.status
    });
    
  } catch (error) {
    console.error('Erro ao processar assinatura criada:', error);
    throw error;
  }
}

/**
 * Processar atualização de assinatura
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Processando atualização de assinatura:', subscription.id);
    
    const customerId = subscription.customer;
    const isActive = subscription.status === 'active';
    
    // Buscar usuário pelo customer_id
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId);
    
    if (error || !users || users.length === 0) {
      console.error('Usuário não encontrado para atualização:', customerId);
      return;
    }

    const user = users[0];

    // Determinar novo status
    let newStatus = user.subscription_status;
    if (isActive && user.subscription_status !== 'active') {
      newStatus = 'active';
    } else if (!isActive && user.subscription_status === 'active') {
      newStatus = 'pending_subscription';
    }

    // Atualizar se necessário
    if (newStatus !== user.subscription_status) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`Status do usuário ${user.email} atualizado para ${newStatus}`);
    }
    
    await logSubscriptionEvent(user.id, 'subscription_updated', {
      subscription_id: subscription.id,
      old_status: user.subscription_status,
      new_status: newStatus,
      stripe_status: subscription.status
    });
    
  } catch (error) {
    console.error('Erro ao processar atualização de assinatura:', error);
    throw error;
  }
}

/**
 * Processar cancelamento de assinatura
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('Processando cancelamento de assinatura:', subscription.id);
    
    const customerId = subscription.customer;
    
    // Buscar usuário pelo customer_id
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId);
    
    if (error || !users || users.length === 0) {
      console.error('Usuário não encontrado para cancelamento:', customerId);
      return;
    }

    const user = users[0];

    // Atualizar status para pending_subscription (mantém email verificado)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'pending_subscription',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`Assinatura do usuário ${user.email} cancelada`);
    
    await logSubscriptionEvent(user.id, 'subscription_cancelled', {
      subscription_id: subscription.id
    });
    
  } catch (error) {
    console.error('Erro ao processar cancelamento de assinatura:', error);
    throw error;
  }
}

/**
 * Processar pagamento bem-sucedido
 */
async function handlePaymentSucceeded(invoice) {
  try {
    console.log('Processando pagamento bem-sucedido:', invoice.id);
    
    const customerId = invoice.customer;
    
    // Buscar usuário pelo customer_id
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId);
    
    if (error || !users || users.length === 0) {
      console.error('Usuário não encontrado para pagamento:', customerId);
      return;
    }

    const user = users[0];

    // Garantir que está ativo
    if (user.subscription_status !== 'active') {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`Usuário ${user.email} reativado após pagamento`);
    }
    
    await logSubscriptionEvent(user.id, 'payment_succeeded', {
      invoice_id: invoice.id,
      amount: invoice.amount_paid
    });
    
  } catch (error) {
    console.error('Erro ao processar pagamento bem-sucedido:', error);
    throw error;
  }
}

/**
 * Processar falha de pagamento
 */
async function handlePaymentFailed(invoice) {
  try {
    console.log('Processando falha de pagamento:', invoice.id);
    
    const customerId = invoice.customer;
    
    // Buscar usuário pelo customer_id
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId);
    
    if (error || !users || users.length === 0) {
      console.error('Usuário não encontrado para falha de pagamento:', customerId);
      return;
    }

    const user = users[0];

    await logSubscriptionEvent(user.id, 'payment_failed', {
      invoice_id: invoice.id,
      amount: invoice.amount_due,
      attempt_count: invoice.attempt_count
    });
    
    console.log(`Falha de pagamento registrada para ${user.email}`);
    
  } catch (error) {
    console.error('Erro ao processar falha de pagamento:', error);
    throw error;
  }
}

/**
 * Registrar evento de assinatura para auditoria
 */
async function logSubscriptionEvent(userId, eventType, metadata = {}) {
  try {
    const logData = {
      user_id: userId,
      event_type: eventType,
      metadata: JSON.stringify(metadata),
      created_at: new Date().toISOString()
    };
    
    console.log('Log de evento:', logData);
    
    // Aqui você pode salvar em uma tabela de logs se desejar
    // await supabase.from('subscription_logs').insert(logData);
    
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
}

// GET /webhook/test
router.get('/test', (req, res) => {
  res.json({
    message: 'Webhook endpoint funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// POST /webhook/test-stripe
router.post('/test-stripe', async (req, res) => {
  try {
    const { customerId, status } = req.body;

    if (!customerId || !status) {
      return res.status(400).json({ error: 'customerId e status são obrigatórios' });
    }

    // Buscar usuário pelo customer_id
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId);
    
    if (error || !users || users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = users[0];

    // Atualizar status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }
    
    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      user: {
        email: user.email,
        old_status: user.subscription_status,
        new_status: status
      }
    });
  } catch (error) {
    console.error('Erro no teste:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;