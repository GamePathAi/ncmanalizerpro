import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testStripeWebhook() {
  console.log('🧪 Testando webhook do Stripe...');
  
  try {
    // 1. Verificar se as variáveis de ambiente estão configuradas
    console.log('\n📋 Verificando configurações:');
    console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Configurada' : '❌ Não encontrada');
    console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Configurada' : '❌ Não encontrada');
    console.log('- SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Não encontrada');
    console.log('- SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não encontrada');
    
    // 2. Listar produtos do Stripe
    console.log('\n🛍️ Produtos configurados no Stripe:');
    const products = await stripe.products.list({ limit: 10 });
    
    for (const product of products.data) {
      console.log(`- ${product.name} (ID: ${product.id})`);
      
      // Listar preços para cada produto
      const prices = await stripe.prices.list({ product: product.id });
      for (const price of prices.data) {
        console.log(`  💰 Preço: ${price.unit_amount / 100} ${price.currency.toUpperCase()} (${price.recurring ? 'recorrente' : 'único'})`);
        console.log(`  🔑 Price ID: ${price.id}`);
      }
    }
    
    // 3. Verificar webhooks configurados
    console.log('\n🔗 Webhooks configurados:');
    const webhooks = await stripe.webhookEndpoints.list();
    
    for (const webhook of webhooks.data) {
      console.log(`- URL: ${webhook.url}`);
      console.log(`  Status: ${webhook.status}`);
      console.log(`  Eventos: ${webhook.enabled_events.join(', ')}`);
    }
    
    // 4. Criar uma sessão de checkout de teste
    console.log('\n🛒 Criando sessão de checkout de teste...');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.VITE_STRIPE_MONTHLY_PRICE_ID, // Usando o price ID do .env
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
      customer_email: 'teste@exemplo.com',
      metadata: {
        user_id: 'test_user_123',
        test: 'true'
      }
    });
    
    console.log('✅ Sessão de checkout criada:');
    console.log(`- Session ID: ${session.id}`);
    console.log(`- URL de pagamento: ${session.url}`);
    
    // 5. Simular evento de webhook
    console.log('\n📡 Para testar o webhook:');
    console.log('1. Acesse a URL de pagamento acima');
    console.log('2. Use o cartão de teste: 4242 4242 4242 4242');
    console.log('3. Use qualquer data futura e CVC');
    console.log('4. Complete o pagamento');
    console.log('5. Verifique os logs do webhook no Supabase');
    
    // 6. Verificar tabela user_profiles
    console.log('\n👥 Verificando estrutura da tabela user_profiles:');
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao acessar user_profiles:', error.message);
    } else {
      console.log('✅ Tabela user_profiles acessível');
      if (profiles.length > 0) {
        console.log('Colunas disponíveis:', Object.keys(profiles[0]).join(', '));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar teste
testStripeWebhook();