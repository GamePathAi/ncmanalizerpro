import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Usar Service Role Key para testes administrativos
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCheckoutDirect() {
  console.log('🧪 Testando checkout diretamente...');
  console.log('=' .repeat(60));
  
  try {
    // 1. Buscar um usuário existente para testar
    console.log('\n1️⃣ Buscando usuário para teste...');
    
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erro ao listar usuários:', usersError.message);
      return;
    }
    
    const testUser = users?.find(user => user.email === 'igor.bonafe@gmail.com') || users?.[0];
    
    if (!testUser) {
      console.log('❌ Nenhum usuário encontrado para teste');
      return;
    }
    
    console.log('✅ Usuário de teste:', testUser.email);
    console.log('🆔 User ID:', testUser.id);
    
    // 2. Verificar configurações do Stripe
    console.log('\n2️⃣ Verificando configurações do Stripe...');
    
    const stripeConfig = {
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      monthlyPriceId: process.env.VITE_STRIPE_MONTHLY_PRICE_ID,
      annualPriceId: process.env.VITE_STRIPE_ANNUAL_PRICE_ID,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    };
    
    console.log('📊 Configurações:');
    Object.entries(stripeConfig).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value ? '✅ Configurada' : '❌ Ausente'}`);
    });
    
    if (!stripeConfig.monthlyPriceId) {
      console.log('\n❌ ERRO CRÍTICO: VITE_STRIPE_MONTHLY_PRICE_ID não configurado!');
      console.log('💡 Adicione no .env: VITE_STRIPE_MONTHLY_PRICE_ID=price_xxx');
      return;
    }
    
    // 3. Testar Edge Function diretamente (sem autenticação de usuário)
    console.log('\n3️⃣ Testando Edge Function create-checkout-session...');
    
    const functionsUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1`;
    const testData = {
      priceId: stripeConfig.monthlyPriceId,
      userId: testUser.id,
      userEmail: testUser.email,
      successUrl: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `http://localhost:5173/pricing`
    };
    
    console.log('🔄 Fazendo requisição para:', `${functionsUrl}/create-checkout-session`);
    console.log('📦 Dados enviados:', testData);
    
    // Primeiro, testar sem autenticação para ver o erro
    console.log('\n🧪 Teste 1: Sem autenticação (deve dar erro 401)...');
    
    const responseNoAuth = await fetch(`${functionsUrl}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📡 Status sem auth:', responseNoAuth.status, responseNoAuth.statusText);
    
    if (responseNoAuth.status === 401) {
      console.log('✅ Erro 401 esperado - Edge Function está ativa mas requer autenticação');
    } else {
      const errorText = await responseNoAuth.text();
      console.log('⚠️ Resposta inesperada:', errorText);
    }
    
    // Segundo, testar com Service Role Key
    console.log('\n🧪 Teste 2: Com Service Role Key...');
    
    const responseWithAuth = await fetch(`${functionsUrl}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📡 Status com Service Role:', responseWithAuth.status, responseWithAuth.statusText);
    
    if (responseWithAuth.ok) {
      const responseData = await responseWithAuth.json();
      console.log('✅ Resposta da Edge Function:', responseData);
      
      if (responseData.sessionId) {
        console.log('🎉 Sessão de checkout criada com sucesso!');
        console.log('🆔 Session ID:', responseData.sessionId);
        console.log('🔗 URL de checkout: https://checkout.stripe.com/c/pay/' + responseData.sessionId);
      }
    } else {
      const errorText = await responseWithAuth.text();
      console.log('❌ Erro com Service Role:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        console.log('🔍 Erro estruturado:', errorData);
        
        if (errorData.error?.includes('No such price')) {
          console.log('\n🔍 DIAGNÓSTICO: Price ID inválido');
          console.log('💡 Verifique se o Price ID existe no Stripe Dashboard');
          console.log('🔗 Stripe Prices: https://dashboard.stripe.com/test/products');
        }
      } catch (e) {
        console.log('⚠️ Resposta não é JSON válido');
      }
    }
    
    // 4. Verificar se a Edge Function existe
    console.log('\n4️⃣ Verificando se Edge Functions estão deployadas...');
    
    const functions = ['create-checkout-session', 'stripe-webhook'];
    
    for (const funcName of functions) {
      const testResponse = await fetch(`${functionsUrl}/${funcName}`, {
        method: 'GET'
      });
      
      console.log(`📡 ${funcName}: ${testResponse.status}`);
      
      if (testResponse.status === 404) {
        console.log(`❌ ${funcName} não está deployada`);
      } else if (testResponse.status === 401 || testResponse.status === 405) {
        console.log(`✅ ${funcName} está ativa`);
      }
    }
    
    // 5. Verificar perfil do usuário de teste
    console.log('\n5️⃣ Verificando perfil do usuário de teste...');
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', testUser.id)
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
    } else {
      console.log('✅ Perfil encontrado:');
      console.log(`   - Email: ${profile.email}`);
      console.log(`   - Status: ${profile.subscription_status}`);
      console.log(`   - Customer ID: ${profile.customer_id || 'Não definido'}`);
      console.log(`   - Nome: ${profile.full_name || 'Não definido'}`);
    }
    
    // 6. Testar conectividade com Stripe
    console.log('\n6️⃣ Testando conectividade com Stripe...');
    
    if (stripeConfig.secretKey) {
      try {
        // Fazer uma requisição simples para a API do Stripe
        const stripeTestResponse = await fetch('https://api.stripe.com/v1/prices/' + stripeConfig.monthlyPriceId, {
          headers: {
            'Authorization': `Bearer ${stripeConfig.secretKey}`
          }
        });
        
        console.log('📡 Status da API Stripe:', stripeTestResponse.status);
        
        if (stripeTestResponse.ok) {
          const priceData = await stripeTestResponse.json();
          console.log('✅ Price encontrado no Stripe:');
          console.log(`   - ID: ${priceData.id}`);
          console.log(`   - Valor: ${priceData.unit_amount / 100} ${priceData.currency.toUpperCase()}`);
          console.log(`   - Tipo: ${priceData.recurring ? 'Recorrente' : 'Único'}`);
        } else {
          const errorText = await stripeTestResponse.text();
          console.log('❌ Erro na API Stripe:', errorText);
        }
      } catch (error) {
        console.log('❌ Erro ao conectar com Stripe:', error.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
    console.error('📄 Stack trace:', error.stack);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 TESTE DIRETO DE CHECKOUT CONCLUÍDO!');
  console.log('\n📋 DIAGNÓSTICO:');
  console.log('1. Se Edge Function retornou 401: ✅ Função ativa, precisa de auth');
  console.log('2. Se Edge Function retornou 404: ❌ Função não deployada');
  console.log('3. Se Stripe retornou erro: ❌ Problema com Price ID ou Secret Key');
  console.log('4. Se tudo funcionou: ✅ Problema pode estar no frontend');
  
  console.log('\n🔧 PRÓXIMOS PASSOS:');
  console.log('1. Se Edge Function não existe: Fazer deploy');
  console.log('2. Se Price ID inválido: Verificar no Stripe Dashboard');
  console.log('3. Se tudo OK: Testar login no frontend e tentar checkout');
}

testCheckoutDirect();