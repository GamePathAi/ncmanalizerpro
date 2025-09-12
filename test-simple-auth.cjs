const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSimpleAuth() {
  console.log('🧪 TESTE DE AUTENTICAÇÃO SIMPLES (SEM TRIGGERS)');
  console.log('=' .repeat(60));
  
  const testEmail = 'teste.simples@exemplo.com';
  const testPassword = 'TesteSenha123!';
  
  try {
    // 1. Tentar cadastro simples
    console.log('👤 Tentando cadastro simples...');
    console.log('- Email:', testEmail);
    console.log('- Senha: ****************');
    console.log('');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Teste'
        }
      }
    });
    
    if (signUpError) {
      console.error('❌ Erro no cadastro:', signUpError.message);
      
      // Se usuário já existe, tentar login
      if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
        console.log('\n⚠️ Usuário já existe, tentando login...');
        return await testLogin(testEmail, testPassword);
      }
      
      return false;
    }
    
    console.log('✅ Cadastro realizado!');
    console.log('- ID do usuário:', signUpData.user?.id);
    console.log('- Email:', signUpData.user?.email);
    console.log('- Email confirmado:', signUpData.user?.email_confirmed_at ? 'SIM' : 'NÃO');
    console.log('- Sessão criada:', signUpData.session ? 'SIM' : 'NÃO');
    
    if (signUpData.session) {
      console.log('\n🎉 CADASTRO E LOGIN AUTOMÁTICO FUNCIONARAM!');
      console.log('- Access Token:', signUpData.session.access_token ? 'PRESENTE' : 'AUSENTE');
      console.log('- Refresh Token:', signUpData.session.refresh_token ? 'PRESENTE' : 'AUSENTE');
      return true;
    }
    
    // 2. Se não criou sessão automaticamente, tentar login manual
    console.log('\n🔐 Tentando login manual...');
    return await testLogin(testEmail, testPassword);
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    return false;
  }
}

async function testLogin(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      console.error('❌ Erro no login:', error.message);
      console.error('- Status:', error.status);
      console.error('- Código:', error.code || 'N/A');
      return false;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('- Usuário:', data.user?.email);
    console.log('- Email confirmado:', data.user?.email_confirmed_at ? 'SIM' : 'NÃO');
    console.log('- Access Token:', data.session?.access_token ? 'PRESENTE' : 'AUSENTE');
    console.log('- Refresh Token:', data.session?.refresh_token ? 'PRESENTE' : 'AUSENTE');
    
    return true;
    
  } catch (err) {
    console.error('❌ Erro no login:', err.message);
    return false;
  }
}

async function testExistingUser() {
  console.log('\n🔍 TESTANDO USUÁRIO EXISTENTE (gamepathai@gmail.com)');
  console.log('=' .repeat(60));
  
  const email = 'gamepathai@gmail.com';
  const possiblePasswords = [
    'TestPassword123!',
    'password123',
    'Password123!',
    'testpassword123',
    '123456789',
    'password',
    'senha123',
    'Senha123!'
  ];
  
  for (const password of possiblePasswords) {
    console.log(`🔐 Testando: ${password.substring(0, 3)}${'*'.repeat(password.length - 3)}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (!error) {
      console.log('\n✅ SENHA CORRETA ENCONTRADA!');
      console.log('- Email:', email);
      console.log('- Senha que funciona:', password);
      console.log('- Usuário logado:', data.user?.email);
      console.log('- Email confirmado:', data.user?.email_confirmed_at ? 'SIM' : 'NÃO');
      return true;
    }
  }
  
  console.log('\n❌ Nenhuma senha testada funcionou para', email);
  return false;
}

async function main() {
  console.log('🔧 TESTE COMPLETO DE AUTENTICAÇÃO');
  console.log('Objetivo: Verificar se o sistema básico funciona sem triggers customizados');
  console.log('');
  
  // Teste 1: Novo usuário simples
  const newUserSuccess = await testSimpleAuth();
  
  if (newUserSuccess) {
    console.log('\n🎉 SUCESSO!');
    console.log('✅ Sistema de autenticação básico está funcionando');
    console.log('✅ O problema anterior era com triggers/funções customizadas');
    console.log('✅ Agora você pode fazer login no browser!');
  } else {
    console.log('\n⚠️ Sistema básico também tem problemas');
  }
  
  // Teste 2: Usuário existente
  await testExistingUser();
  
  console.log('\n📋 RESUMO:');
  console.log('- Se o teste simples funcionou: problema era com triggers customizados');
  console.log('- Se encontrou senha para gamepathai@gmail.com: use essa senha no browser');
  console.log('- Se nada funcionou: há problema mais profundo no Supabase');
}

main().catch(console.error);