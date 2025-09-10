// Teste para reproduzir o erro 'Failed to fetch' do frontend
import { createClient } from '@supabase/supabase-js';

// Usar as mesmas configurações do frontend
const supabaseUrl = 'https://fsntzljufghutoyqxokm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTY0MDEsImV4cCI6MjA2OTE3MjQwMX0.MTkYFy_FfnGOiHrDVjV3AWDYao8YLQf1TnnBWeJwG-I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendSignUp() {
  console.log('🧪 Testando cadastro como no frontend...');
  
  const testEmail = 'gamepathai@gmail.com'; // Usando seu email autorizado
  const testPassword = 'TestPassword123!';
  
  try {
    console.log('📧 Tentando cadastrar:', testEmail);
    
    // Simular exatamente como o frontend faz
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `http://localhost:5173/auth/callback`
      }
    });
    
    if (error) {
      console.error('❌ Erro no cadastro:', error.message);
      console.error('🔍 Tipo do erro:', error.name);
      console.error('🔍 Código do erro:', error.status);
      console.error('🔍 Detalhes completos:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('✅ Cadastro realizado com sucesso!');
    console.log('👤 Usuário criado:', data.user?.id);
    console.log('📧 Email:', data.user?.email);
    console.log('🔗 Confirmação necessária:', !data.user?.email_confirmed_at);
    
    return true;
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    console.error('🔍 Stack trace:', err.stack);
    return false;
  }
}

async function testConnection() {
  console.log('🔗 Testando conectividade básica...');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro de conectividade:', error.message);
      return false;
    }
    
    console.log('✅ Conectividade OK');
    return true;
  } catch (err) {
    console.error('❌ Erro de rede:', err.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de diagnóstico...');
  
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('❌ Falha na conectividade básica');
    return;
  }
  
  const signUpOk = await testFrontendSignUp();
  if (!signUpOk) {
    console.log('❌ Falha no teste de cadastro');
    return;
  }
  
  console.log('🎉 Todos os testes passaram!');
}

runTests().catch(console.error);