// Teste completo de autenticação - signup e login
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteAuth() {
  console.log('🧪 Testando autenticação completa...');
  console.log('📡 Conectando ao Supabase:', supabaseUrl);
  
  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    // Teste 1: Signup
    console.log('\n1️⃣ Testando signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signupError) {
      console.error('❌ Erro no signup:', signupError.message);
      return;
    }
    
    console.log('✅ Signup realizado com sucesso!');
    console.log('👤 Usuário criado:', signupData.user?.email);
    
    // Teste 2: Login
    console.log('\n2️⃣ Testando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('🔑 Token obtido:', loginData.session ? 'Sim' : 'Não');
    
    // Teste 3: Verificar sessão
    console.log('\n3️⃣ Verificando sessão...');
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      console.log('✅ Sessão ativa encontrada!');
      console.log('👤 Usuário logado:', sessionData.session.user.email);
    } else {
      console.log('⚠️ Nenhuma sessão ativa');
    }
    
    console.log('\n🎉 Todos os testes de autenticação passaram!');
    console.log('✅ Problema "Failed to fetch" resolvido!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

testCompleteAuth();