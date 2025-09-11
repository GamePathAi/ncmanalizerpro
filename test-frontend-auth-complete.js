import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Teste Completo de Autenticação Frontend');
console.log('==================================================');
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
console.log('');

async function testCompleteAuthFlow() {
  const testEmail = 'gamepathai@gmail.com';
  const testPassword = 'TestPassword123!';
  
  try {
    console.log('📧 Testando signup com:', testEmail);
    
    // 1. Teste de Signup
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signupError) {
      console.log('⚠️  Erro no signup (pode ser usuário já existente):', signupError.message);
    } else {
      console.log('✅ Signup realizado com sucesso!');
      console.log('👤 Usuário:', signupData.user?.email);
      console.log('🆔 ID:', signupData.user?.id);
      console.log('📧 Email confirmado:', signupData.user?.email_confirmed_at ? 'SIM' : 'NÃO');
    }
    
    console.log('');
    
    // 2. Teste de Login
    console.log('🔐 Testando login com:', testEmail);
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário logado:', loginData.user?.email);
    console.log('🔑 Access Token:', loginData.session?.access_token ? 'PRESENTE' : 'AUSENTE');
    console.log('🔄 Refresh Token:', loginData.session?.refresh_token ? 'PRESENTE' : 'AUSENTE');
    
    console.log('');
    
    // 3. Teste de JWT Token
    if (loginData.session?.access_token) {
      console.log('🔍 Testando JWT Token...');
      
      // Testar chamada autenticada para create-checkout-session
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${loginData.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: 'price_test_123',
            userId: loginData.user.id
          })
        });
        
        const result = await response.text();
        console.log('📊 Status da função create-checkout-session:', response.status);
        console.log('📋 Resposta:', result.substring(0, 200) + '...');
        
        if (response.status === 401) {
          console.log('❌ JWT ainda inválido - problema na validação do token');
        } else if (response.status === 200) {
          console.log('✅ JWT válido - autenticação funcionando!');
        }
        
      } catch (error) {
        console.log('❌ Erro ao testar JWT:', error.message);
      }
    }
    
    console.log('');
    
    // 4. Teste de Session Atual
    console.log('🔍 Verificando sessão atual...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao obter sessão:', sessionError.message);
    } else if (sessionData.session) {
      console.log('✅ Sessão ativa encontrada!');
      console.log('👤 Usuário da sessão:', sessionData.session.user?.email);
      console.log('⏰ Expira em:', new Date(sessionData.session.expires_at * 1000).toLocaleString());
    } else {
      console.log('⚠️  Nenhuma sessão ativa encontrada');
    }
    
    console.log('');
    
    // 5. Logout
    console.log('🚪 Fazendo logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.log('❌ Erro no logout:', logoutError.message);
    } else {
      console.log('✅ Logout realizado com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

// Executar teste
testCompleteAuthFlow().then(() => {
  console.log('');
  console.log('📋 RESULTADO DO TESTE COMPLETO:');
  console.log('==================================================');
  console.log('✅ Supabase Client: CONFIGURADO');
  console.log('✅ Variáveis de Ambiente: CARREGADAS');
  console.log('🔄 Fluxo de Autenticação: TESTADO');
  console.log('');
  console.log('🎯 PRÓXIMOS PASSOS:');
  console.log('1. Verificar se JWT validation está funcionando');
  console.log('2. Testar signup/login no frontend');
  console.log('3. Verificar se emails de confirmação estão sendo enviados');
  console.log('4. Testar integração com Stripe se necessário');
}).catch(error => {
  console.error('❌ Erro fatal no teste:', error);
});