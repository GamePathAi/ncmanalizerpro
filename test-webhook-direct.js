import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const WEBHOOK_URL = 'https://fsntzljufghutoyqxokm.supabase.co/functions/v1/stripe-webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Evento de teste simulando um checkout.session.completed
const testEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2020-08-27',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_webhook_session',
      object: 'checkout.session',
      customer: 'cus_test_customer',
      customer_email: 'teste@exemplo.com',
      mode: 'subscription',
      payment_status: 'paid',
      subscription: 'sub_test_subscription',
      metadata: {
        user_id: 'test_user_123'
      },
      line_items: {
        data: [
          {
            price: {
              id: process.env.VITE_STRIPE_MONTHLY_PRICE_ID,
              product: 'prod_T1sUXzLzaDScNZ',
              unit_amount: 24700,
              currency: 'brl',
              recurring: {
                interval: 'month'
              }
            },
            quantity: 1
          }
        ]
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_webhook',
    idempotency_key: null
  },
  type: 'checkout.session.completed'
};

function createStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

async function testWebhookDirect() {
  console.log('🧪 Testando webhook diretamente...');
  
  try {
    const payload = JSON.stringify(testEvent);
    const signature = createStripeSignature(testEvent, WEBHOOK_SECRET);
    
    console.log('📡 Enviando evento de teste para o webhook...');
    console.log('- Evento:', testEvent.type);
    console.log('- Customer Email:', testEvent.data.object.customer_email);
    console.log('- Price ID:', testEvent.data.object.line_items.data[0].price.id);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      body: payload
    });
    
    console.log('\n📊 Resposta do webhook:');
    console.log('- Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('- Resposta:', responseText || 'Sem conteúdo');
    
    if (response.ok) {
      console.log('\n✅ Webhook processado com sucesso!');
      console.log('\n📋 Próximos passos:');
      console.log('1. Verifique os logs no Supabase Dashboard');
      console.log('2. Confirme se os dados foram salvos na tabela user_profiles');
      console.log('3. Teste com um pagamento real usando a URL gerada anteriormente');
    } else {
      console.log('\n❌ Erro no webhook. Verifique:');
      console.log('1. Se a Edge Function está deployada corretamente');
      console.log('2. Se o STRIPE_WEBHOOK_SECRET está correto');
      console.log('3. Os logs da função no Supabase');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message);
  }
}

// Executar teste
testWebhookDirect();