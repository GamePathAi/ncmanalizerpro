import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCheckoutFlow() {
  console.log('🧪 Testando fluxo de checkout...');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar se há usuário logado
    console.log('\n1️⃣ Verificando usuário logado...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao obter sessão:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('❌ Nenhum usuário logado');
      console.log('💡 Faça login primeiro com: igor.bonafe@gmail.com');
      return;
    }
    
    console.log('✅ Usuário logado:', session.user.email);
    console.log('🔑 Token presente:', !!session.access_token);
    
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
    console.log(`   - Publishable Key: ${stripeConfig.publishableKey ? 'Configurada' : 'Ausente'}`);
    console.log(`   - Secret Key: ${stripeConfig.secretKey ? 'Configurada' : 'Ausente'}`);
    console.log(`   - Monthly Price ID: ${stripeConfig.monthlyPriceId || 'Ausente'}`);
    console.log(`   - Annual Price ID: ${stripeConfig.annualPriceId || 'Ausente'}`);
    console.log(`   - Webhook Secret: ${stripeConfig.webhookSecret ? 'Configurada' : 'Ausente'}`);
    
    // 3. Testar Edge Function create-checkout-session
    console.log('\n3️⃣ Testando Edge Function create-checkout-session...');
    
    const functionsUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1`;
    const testData = {
      priceId: stripeConfig.monthlyPriceId,
      userId: session.user.id,
      userEmail: session.user.email,
      successUrl: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `http://localhost:5173/pricing`
    };
    
    console.log('🔄 Fazendo requisição para:', `${functionsUrl}/create-checkout-session`);
    console.log('📦 Dados enviados:', testData);
    
    const response = await fetch(`${functionsUrl}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📡 Status da resposta:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro da Edge Function:');
      console.log('📄 Resposta completa:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        console.log('🔍 Erro estruturado:', errorData);
      } catch (e) {
        console.log('⚠️ Resposta não é JSON válido');
      }
      
      // Diagnóstico baseado no status
      if (response.status === 401) {
        console.log('\n🔍 DIAGNÓSTICO - Erro 401:');
        console.log('- Token de autenticação inválido ou expirado');
        console.log('- Usuário não tem permissão para acessar a função');
        console.log('- Verificar se o usuário está realmente logado');
      } else if (response.status === 404) {
        console.log('\n🔍 DIAGNÓSTICO - Erro 404:');
        console.log('- Edge Function não foi deployada');
        console.log('- URL da função está incorreta');
        console.log('- Projeto Supabase incorreto');
      } else if (response.status === 500) {
        console.log('\n🔍 DIAGNÓSTICO - Erro 500:');
        console.log('- Erro interno na Edge Function');
        console.log('- Problema com configurações do Stripe');
        console.log('- Verificar logs da função no Supabase');
      }
      
      return;
    }
    
    const responseData = await response.json();
    console.log('✅ Resposta da Edge Function:', responseData);
    
    if (responseData.sessionId) {
      console.log('🎉 Sessão de checkout criada com sucesso!');
      console.log('🆔 Session ID:', responseData.sessionId);
      
      // 4. Verificar se a sessão é válida no Stripe
      console.log('\n4️⃣ Verificando sessão no Stripe...');
      
      // Simular o que o frontend faria
      const checkoutUrl = `https://checkout.stripe.com/c/pay/${responseData.sessionId}`;
      console.log('🔗 URL de checkout:', checkoutUrl);
      console.log('💡 Esta URL deveria abrir o Stripe Checkout');
      
    } else {
      console.log('❌ Resposta não contém sessionId');
      console.log('📄 Resposta completa:', responseData);
    }
    
    // 5. Verificar Edge Function de webhook
    console.log('\n5️⃣ Verificando Edge Function stripe-webhook...');
    
    const webhookResponse = await fetch(`${functionsUrl}/stripe-webhook`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    console.log('📡 Status do webhook:', webhookResponse.status);
    
    if (webhookResponse.status === 405) {
      console.log('✅ Webhook ativo (Method Not Allowed é esperado para GET)');
    } else if (webhookResponse.status === 404) {
      console.log('❌ Webhook não deployado');
    } else {
      console.log('⚠️ Status inesperado do webhook');
    }
    
    // 6. Verificar perfil do usuário
    console.log('\n6️⃣ Verificando perfil do usuário...');
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
    } else {
      console.log('✅ Perfil encontrado:');
      console.log(`   - Email: ${profile.email}`);
      console.log(`   - Status: ${profile.subscription_status}`);
      console.log(`   - Customer ID: ${profile.customer_id || 'Não definido'}`);
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
    console.error('📄 Stack trace:', error.stack);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 TESTE DE CHECKOUT CONCLUÍDO!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Se Edge Function retornou erro, verificar logs no Supabase');
  console.log('2. Se sessionId foi criado, testar no browser');
  console.log('3. Verificar se webhook está configurado no Stripe');
  console.log('4. Testar fluxo completo: checkout → pagamento → webhook');
  
  console.log('\n🔗 LINKS ÚTEIS:');
  console.log(`- Supabase Functions: https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}/functions`);
  console.log(`- Stripe Dashboard: https://dashboard.stripe.com/test/payments`);
  console.log(`- Webhook Logs: https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}/functions/stripe-webhook/logs`);
}

testCheckoutFlow();