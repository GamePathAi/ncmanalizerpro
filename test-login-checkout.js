import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testLoginAndCheckout() {
  console.log('🧪 Testando login e checkout...');
  console.log('=' .repeat(60));
  
  try {
    // 1. Fazer login
    console.log('\n1️⃣ Fazendo login...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'igor.bonafe@gmail.com',
      password: 'teste123' // Substitua pela senha correta
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      console.log('💡 Verifique se o usuário existe e a senha está correta');
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('🔑 Token presente:', !!loginData.session?.access_token);
    console.log('👤 Usuário:', loginData.user?.email);
    
    // 2. Testar checkout com usuário logado
    console.log('\n2️⃣ Testando checkout com usuário logado...');
    
    const functionsUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1`;
    const testData = {
      priceId: process.env.VITE_STRIPE_MONTHLY_PRICE_ID,
      userId: loginData.user.id,
      userEmail: loginData.user.email,
      successUrl: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `http://localhost:5173/pricing`
    };
    
    console.log('🔄 Fazendo requisição para:', `${functionsUrl}/create-checkout-session`);
    console.log('📦 Dados enviados:', testData);
    
    const response = await fetch(`${functionsUrl}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.session.access_token}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📡 Status da resposta:', response.status, response.statusText);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ Checkout session criada com sucesso!');
      console.log('🆔 Session ID:', responseData.sessionId);
      console.log('🔗 URL:', responseData.url);
    } else {
      const errorData = await response.json();
      console.log('❌ Erro na Edge Function:', errorData);
    }
    
    // 3. Fazer logout
    console.log('\n3️⃣ Fazendo logout...');
    await supabase.auth.signOut();
    console.log('✅ Logout realizado');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
    console.error('📄 Stack trace:', error.stack);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 TESTE DE LOGIN E CHECKOUT CONCLUÍDO!');
}

testLoginAndCheckout();