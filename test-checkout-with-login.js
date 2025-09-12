import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCheckoutWithLogin() {
  console.log('🧪 Testando checkout com login simulado...');
  console.log('=' .repeat(60));
  
  try {
    // 1. Fazer login com usuário existente
    console.log('\n1️⃣ Fazendo login...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'igor.bonafe@gmail.com',
      password: 'senha123' // Você pode precisar ajustar a senha
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      console.log('💡 Tente com a senha correta ou use outro usuário');
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', loginData.user?.email);
    console.log('🔑 Token presente:', !!loginData.session?.access_token);
    
    // 2. Testar criação de sessão de checkout
    console.log('\n2️⃣ Testando criação de sessão de checkout...');
    
    const functionsUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1`;
    const checkoutData = {
      priceId: process.env.VITE_STRIPE_MONTHLY_PRICE_ID,
      userId: loginData.user.id,
      userEmail: loginData.user.email,
      successUrl: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `http://localhost:5173/pricing`
    };
    
    console.log('🔄 Fazendo requisição para:', `${functionsUrl}/create-checkout-session`);
    console.log('📦 Dados enviados:', checkoutData);
    
    const response = await fetch(`${functionsUrl}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.session.access_token}`
      },
      body: JSON.stringify(checkoutData)
    });
    
    console.log('📡 Status da resposta:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro da Edge Function:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        console.log('🔍 Erro estruturado:', errorData);
        
        // Diagnóstico específico
        if (errorData.error?.includes('Invalid JWT')) {
          console.log('\n🔍 DIAGNÓSTICO: Token JWT inválido');
          console.log('💡 O token do usuário pode ter expirado');
        } else if (errorData.error?.includes('No such price')) {
          console.log('\n🔍 DIAGNÓSTICO: Price ID inválido');
          console.log('💡 Verificar VITE_STRIPE_MONTHLY_PRICE_ID no .env');
        } else if (errorData.error?.includes('User ID mismatch')) {
          console.log('\n🔍 DIAGNÓSTICO: ID do usuário não confere');
          console.log('💡 Problema na validação de segurança');
        }
      } catch (e) {
        console.log('⚠️ Resposta não é JSON válido');
      }
      
      return;
    }
    
    const responseData = await response.json();
    console.log('✅ Resposta da Edge Function:', responseData);
    
    if (responseData.sessionId) {
      console.log('🎉 Sessão de checkout criada com sucesso!');
      console.log('🆔 Session ID:', responseData.sessionId);
      
      // 3. Simular o que o Stripe.js faria
      console.log('\n3️⃣ Simulando redirecionamento do Stripe...');
      
      const checkoutUrl = `https://checkout.stripe.com/c/pay/${responseData.sessionId}`;
      console.log('🔗 URL de checkout:', checkoutUrl);
      console.log('💡 Esta URL deveria abrir o Stripe Checkout no browser');
      
      // Verificar se a sessão é válida fazendo uma requisição HEAD
      try {
        const checkResponse = await fetch(checkoutUrl, { method: 'HEAD' });
        console.log('📡 Status da URL de checkout:', checkResponse.status);
        
        if (checkResponse.status === 200) {
          console.log('✅ URL de checkout válida!');
        } else {
          console.log('⚠️ URL de checkout pode estar inválida');
        }
      } catch (error) {
        console.log('⚠️ Não foi possível verificar URL de checkout:', error.message);
      }
      
    } else {
      console.log('❌ Resposta não contém sessionId');
      console.log('📄 Resposta completa:', responseData);
    }
    
    // 4. Fazer logout
    console.log('\n4️⃣ Fazendo logout...');
    await supabase.auth.signOut();
    console.log('✅ Logout realizado');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
    console.error('📄 Stack trace:', error.stack);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 TESTE DE CHECKOUT COM LOGIN CONCLUÍDO!');
  console.log('\n📋 INTERPRETAÇÃO DOS RESULTADOS:');
  console.log('✅ Se sessionId foi criado: Edge Function está funcionando');
  console.log('✅ Se URL de checkout é válida: Stripe está configurado corretamente');
  console.log('❌ Se houve erro: Verificar logs e configurações');
  
  console.log('\n🔧 PRÓXIMOS PASSOS:');
  console.log('1. Se tudo funcionou aqui: Problema está no frontend');
  console.log('2. Se houve erro: Corrigir configurações antes de testar no browser');
  console.log('3. Testar no browser: http://localhost:5173');
  
  console.log('\n💡 DICAS PARA TESTE NO BROWSER:');
  console.log('1. Abra o console do browser (F12)');
  console.log('2. Faça login com igor.bonafe@gmail.com');
  console.log('3. Vá para pricing e clique "Assinar Mensal"');
  console.log('4. Preencha o checkout e clique "Finalizar"');
  console.log('5. Observe os logs no console');
}

testCheckoutWithLogin();