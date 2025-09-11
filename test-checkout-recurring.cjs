const Stripe = require('stripe');
require('dotenv').config();

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Novos Price IDs recorrentes
const RECURRING_PRICE_IDS = {
  BASIC: 'price_1S6Cqx0qhrqQ3Ot3vizSWOnH',
  PRO: 'price_1S6Cqy0qhrqQ3Ot3Nt5nwkKR', 
  ENTERPRISE: 'price_1S6Cqz0qhrqQ3Ot3oV3Y21wP'
};

async function testCheckoutSession(priceId, planName) {
  console.log(`\n🧪 Testando checkout para ${planName} (${priceId})...`);
  
  try {
    // Simular criação de sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // Modo subscription
      success_url: 'http://localhost:5175/dashboard?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:5175/pricing?canceled=true',
      metadata: {
        supabase_user_id: 'test_user_123',
      },
      subscription_data: {
        metadata: {
          supabase_user_id: 'test_user_123',
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });
    
    console.log(`✅ ${planName}: Sessão criada com sucesso!`);
    console.log(`   📋 Session ID: ${session.id}`);
    console.log(`   🔗 URL: ${session.url}`);
    console.log(`   💳 Mode: ${session.mode}`);
    console.log(`   📊 Status: ${session.status}`);
    
    return { success: true, sessionId: session.id };
    
  } catch (error) {
    console.log(`❌ ${planName}: ERRO - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAllPlans() {
  console.log('🚀 Testando criação de sessões de checkout com Price IDs recorrentes...\n');
  
  const results = [];
  
  for (const [planName, priceId] of Object.entries(RECURRING_PRICE_IDS)) {
    const result = await testCheckoutSession(priceId, planName);
    results.push({ planName, ...result });
  }
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('=' .repeat(50));
  
  let successCount = 0;
  let errorCount = 0;
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.planName}: SUCESSO`);
      successCount++;
    } else {
      console.log(`❌ ${result.planName}: FALHOU - ${result.error}`);
      errorCount++;
    }
  });
  
  console.log('\n🎯 RESULTADO FINAL:');
  console.log(`   ✅ Sucessos: ${successCount}/${results.length}`);
  console.log(`   ❌ Erros: ${errorCount}/${results.length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('Os Price IDs recorrentes estão funcionando corretamente.');
    console.log('O erro "You must provide at least one recurring price" foi resolvido!');
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM!');
    console.log('Verifique os erros acima e corrija os Price IDs problemáticos.');
  }
}

// Função para verificar se um price é recorrente
async function verifyRecurringPrices() {
  console.log('\n🔍 Verificando se os Price IDs são recorrentes...\n');
  
  for (const [planName, priceId] of Object.entries(RECURRING_PRICE_IDS)) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      
      console.log(`📋 ${planName} (${priceId}):`);
      console.log(`   💰 Valor: ${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
      console.log(`   🔄 Tipo: ${price.type}`);
      
      if (price.recurring) {
        console.log(`   ✅ Recorrente: ${price.recurring.interval} (${price.recurring.interval_count}x)`);
      } else {
        console.log(`   ❌ NÃO é recorrente!`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${planName}: Erro ao verificar - ${error.message}\n`);
    }
  }
}

// Executar testes
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify')) {
    verifyRecurringPrices().catch(console.error);
  } else {
    testAllPlans().catch(console.error);
  }
}

module.exports = { testCheckoutSession, testAllPlans, verifyRecurringPrices };