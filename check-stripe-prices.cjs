const Stripe = require('stripe');
require('dotenv').config();

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Price IDs para verificar
const priceIds = {
  ANNUAL: process.env.VITE_STRIPE_ANNUAL_PRICE_ID || 'price_1S67e80qhrqQ3Ot3vnlkAFTK',
  MONTHLY: process.env.VITE_STRIPE_MONTHLY_PRICE_ID || 'price_1S67dR0qhrqQ3Ot3cKb0CxVc',
  BASIC_MONTHLY: process.env.REACT_APP_STRIPE_BASIC_MONTHLY_PRICE_ID,
  PRO_MONTHLY: process.env.REACT_APP_STRIPE_PRO_MONTHLY_PRICE_ID,
  ENTERPRISE_MONTHLY: process.env.REACT_APP_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID
};

async function checkPriceConfiguration() {
  console.log('🔍 Verificando configuração dos Price IDs no Stripe...\n');
  
  for (const [planName, priceId] of Object.entries(priceIds)) {
    if (!priceId || priceId.startsWith('price_') === false) {
      console.log(`❌ ${planName}: Price ID inválido ou não configurado (${priceId})`);
      continue;
    }
    
    try {
      const price = await stripe.prices.retrieve(priceId);
      
      console.log(`\n📋 ${planName} (${priceId}):`);
      console.log(`   💰 Valor: ${price.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A'} ${price.currency?.toUpperCase()}`);
      console.log(`   🔄 Tipo: ${price.type}`);
      
      if (price.recurring) {
        console.log(`   ✅ Recorrente: ${price.recurring.interval} (a cada ${price.recurring.interval_count} ${price.recurring.interval}(s))`);
        console.log(`   📊 Status: CONFIGURADO CORRETAMENTE`);
      } else {
        console.log(`   ❌ Recorrente: NÃO (este é o problema!)`);
        console.log(`   📊 Status: PRECISA SER RECONFIGURADO`);
      }
      
      // Verificar produto associado
      if (price.product) {
        const product = await stripe.products.retrieve(price.product.toString());
        console.log(`   📦 Produto: ${product.name}`);
        console.log(`   📝 Descrição: ${product.description || 'N/A'}`);
      }
      
    } catch (error) {
      console.log(`❌ ${planName}: Erro ao buscar price (${error.message})`);
    }
  }
  
  console.log('\n🎯 DIAGNÓSTICO:');
  console.log('Se algum price mostrar "❌ Recorrente: NÃO", esse é o problema!');
  console.log('Prices para assinaturas DEVEM ter o campo "recurring" configurado.');
  console.log('\n💡 SOLUÇÃO:');
  console.log('1. Acesse o Stripe Dashboard');
  console.log('2. Vá em Products > [Seu Produto]');
  console.log('3. Crie novos prices com "Recurring" habilitado');
  console.log('4. Atualize as variáveis de ambiente com os novos Price IDs');
}

// Função para criar prices recorrentes corretos
async function createRecurringPrices() {
  console.log('\n🛠️ Criando prices recorrentes corretos...\n');
  
  const plans = [
    {
      name: 'NCM Pro - Básico Mensal',
      amount: 2990, // R$ 29,90
      interval: 'month',
      description: 'Plano básico mensal do NCM Pro'
    },
    {
      name: 'NCM Pro - Profissional Mensal', 
      amount: 7990, // R$ 79,90
      interval: 'month',
      description: 'Plano profissional mensal do NCM Pro'
    },
    {
      name: 'NCM Pro - Enterprise Mensal',
      amount: 19990, // R$ 199,90
      interval: 'month', 
      description: 'Plano enterprise mensal do NCM Pro'
    }
  ];
  
  for (const plan of plans) {
    try {
      // Criar produto
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });
      
      // Criar price recorrente
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amount,
        currency: 'brl',
        recurring: {
          interval: plan.interval,
        },
      });
      
      console.log(`✅ ${plan.name}:`);
      console.log(`   📦 Product ID: ${product.id}`);
      console.log(`   💰 Price ID: ${price.id}`);
      console.log(`   🔄 Recorrente: ${price.recurring.interval}`);
      console.log('');
      
    } catch (error) {
      console.log(`❌ Erro ao criar ${plan.name}: ${error.message}`);
    }
  }
}

// Executar verificação
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--create')) {
    createRecurringPrices().catch(console.error);
  } else {
    checkPriceConfiguration().catch(console.error);
  }
}

module.exports = { checkPriceConfiguration, createRecurringPrices };