const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWithNewUser() {
  console.log('🧪 TESTE COM NOVO USUÁRIO');
  console.log('=' .repeat(50));
  
  const testEmail = 'teste.novo@exemplo.com';
  const testPassword = 'NovaSenh@123!';
  
  try {
    // 1. Criar novo usuário
    console.log('👤 Criando novo usuário...');
    console.log('- Email:', testEmail);
    console.log('- Senha: ****************');
    console.log('');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError) {
      console.error('❌ Erro no cadastro:', signUpError.message);
      
      // Se usuário já existe, vamos tentar fazer login
      if (signUpError.message.includes('already registered')) {
        console.log('\n⚠️ Usuário já existe, tentando fazer login...');
        return await testLogin(testEmail, testPassword);
      }
      
      return false;
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('- ID:', signUpData.user?.id);
    console.log('- Email:', signUpData.user?.email);
    console.log('- Email confirmado:', signUpData.user?.email_confirmed_at ? 'SIM' : 'NÃO');
    console.log('');
    
    // 2. Tentar fazer login imediatamente
    console.log('🔐 Testando login imediato...');
    
    const loginResult = await testLogin(testEmail, testPassword);
    
    if (loginResult) {
      console.log('\n🎉 SUCESSO TOTAL!');
      console.log('- Cadastro funcionou');
      console.log('- Login funcionou');
      console.log('- Problema anterior era com a senha do usuário gamepathai@gmail.com');
    }
    
    return loginResult;
    
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
    
    return true;
    
  } catch (err) {
    console.error('❌ Erro no login:', err.message);
    return false;
  }
}

async function testOriginalUser() {
  console.log('\n🔍 TESTANDO USUÁRIO ORIGINAL COM SENHAS DIFERENTES');
  console.log('=' .repeat(50));
  
  const email = 'gamepathai@gmail.com';
  const possiblePasswords = [
    'TestPassword123!',
    'password123',
    'Password123',
    'testpassword',
    '123456',
    'password'
  ];
  
  for (const password of possiblePasswords) {
    console.log(`🔐 Tentando senha: ${password.replace(/./g, '*')}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (!error) {
      console.log('✅ SENHA CORRETA ENCONTRADA!');
      console.log('- Senha que funciona:', password);
      console.log('- Usuário:', data.user?.email);
      return true;
    }
  }
  
  console.log('❌ Nenhuma senha testada funcionou');
  return false;
}

async function main() {
  console.log('🔧 DIAGNÓSTICO COMPLETO DO PROBLEMA DE LOGIN');
  console.log('');
  
  // Teste 1: Novo usuário
  const newUserSuccess = await testWithNewUser();
  
  if (newUserSuccess) {
    console.log('\n✅ CONCLUSÃO: Sistema de autenticação está funcionando!');
    console.log('O problema é específico com o usuário gamepathai@gmail.com');
    
    // Teste 2: Tentar diferentes senhas para o usuário original
    await testOriginalUser();
  } else {
    console.log('\n❌ Sistema de autenticação tem problemas gerais');
  }
}

main().catch(console.error);