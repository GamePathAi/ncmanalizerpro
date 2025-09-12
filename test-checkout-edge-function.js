// Teste específico para a Edge Function de checkout
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const monthlyPriceId = process.env.VITE_STRIPE_MONTHLY_PRICE_ID;

console.log('🔍 Testando Edge Function create-checkout-session...');
console.log('📋 Configurações:');
console.log('Supabase URL:', supabaseUrl);
console.log('Monthly Price ID:', monthlyPriceId);

if (!supabaseUrl || !supabaseAnonKey || !monthlyPriceId) {
  console.error('❌ Variáveis de ambiente faltando!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEdgeFunction() {
  try {
    console.log('\n🔄 Criando usuário de teste...');
    
    // Criar usuário de teste primeiro
    const testEmail = `user${Date.now()}@gmail.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('📧 Email de teste:', testEmail);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Teste'
        }
      }
    });
    
    if (signupError) {
      console.error('❌ Erro no signup:', signupError.message);
      return false;
    }
    
    console.log('✅ Usuário criado com sucesso');
    console.log('👤 Usuário:', signupData.user?.email);
    
    // Aguardar um pouco para o perfil ser criado
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fazer login com usuário de teste
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return false;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', authData.user.email);
    
    // Obter token de acesso
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('❌ Token de acesso não encontrado');
      return false;
    }
    
    console.log('🔑 Token obtido com sucesso');
    
    // Testar Edge Function
    console.log('\n🔄 Testando Edge Function...');
    
    const functionsUrl = `${supabaseUrl}/functions/v1`;
    const requestData = {
      priceId: monthlyPriceId,
      userId: authData.user.id,
      userEmail: authData.user.email,
      successUrl: 'http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'http://localhost:5173/pricing'
    };
    
    console.log('📦 Dados da requisição:', requestData);
    
    const response = await fetch(`${functionsUrl}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(requestData)
    });
    
    console.log('📡 Status da resposta:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Resposta bruta:', responseText);
    
    if (!response.ok) {
      console.error('❌ Edge Function retornou erro');
      try {
        const errorData = JSON.parse(responseText);
        console.error('📋 Detalhes do erro:', errorData);
      } catch {
        console.error('📋 Resposta não é JSON válido');
      }
      return false;
    }
    
    try {
      const responseData = JSON.parse(responseText);
      console.log('✅ Edge Function funcionou!');
      console.log('🎫 Session ID:', responseData.sessionId);
      return true;
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta JSON:', parseError.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('📋 Stack trace:', error.stack);
    return false;
  } finally {
    // Fazer logout
    await supabase.auth.signOut();
    console.log('\n🚪 Logout realizado');
  }
}

// Executar teste
testEdgeFunction().then(success => {
  if (success) {
    console.log('\n🎉 Teste da Edge Function passou!');
    console.log('💡 O problema pode estar no frontend ou na inicialização do Stripe');
  } else {
    console.log('\n❌ Teste da Edge Function falhou!');
    console.log('💡 Verifique as configurações da Edge Function e do Stripe');
    process.exit(1);
  }
});