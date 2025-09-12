const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLoginAfterFix() {
  console.log('🎯 TESTANDO LOGIN APÓS CORREÇÃO');
  console.log('=' .repeat(50));
  console.log('✅ Configuração alterada: enable_confirmations = false');
  console.log('✅ Supabase reiniciado com nova configuração');
  console.log('');
  
  const testEmail = 'gamepathai@gmail.com';
  const testPassword = 'TestPassword123!';
  
  try {
    console.log('🔐 Tentando fazer login...');
    console.log('- Email:', testEmail);
    console.log('- Senha: ****************');
    console.log('');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.error('❌ ERRO NO LOGIN:');
      console.error('- Mensagem:', error.message);
      console.error('- Status:', error.status);
      console.error('- Código:', error.code || 'N/A');
      console.log('');
      console.log('🔍 POSSÍVEIS CAUSAS:');
      console.log('1. Senha incorreta');
      console.log('2. Usuário não existe');
      console.log('3. Configuração ainda não aplicada');
      return false;
    }
    
    console.log('🎉 LOGIN REALIZADO COM SUCESSO!');
    console.log('=' .repeat(50));
    console.log('👤 DADOS DO USUÁRIO:');
    console.log('- ID:', data.user?.id);
    console.log('- Email:', data.user?.email);
    console.log('- Email confirmado:', data.user?.email_confirmed_at ? 'SIM' : 'NÃO');
    console.log('- Criado em:', data.user?.created_at);
    console.log('- Último login:', data.user?.last_sign_in_at || 'Agora');
    console.log('');
    console.log('🔑 SESSÃO:');
    console.log('- Access Token:', data.session?.access_token ? 'PRESENTE' : 'AUSENTE');
    console.log('- Refresh Token:', data.session?.refresh_token ? 'PRESENTE' : 'AUSENTE');
    console.log('- Expira em:', data.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'N/A');
    console.log('');
    console.log('✅ PROBLEMA RESOLVIDO!');
    console.log('Agora você pode fazer login no browser normalmente.');
    
    return true;
    
  } catch (err) {
    console.error('❌ ERRO INESPERADO:', err.message);
    return false;
  }
}

async function main() {
  console.log('🔧 TESTE DE LOGIN APÓS CORREÇÃO DO ERRO 400');
  console.log('');
  
  const success = await testLoginAfterFix();
  
  if (!success) {
    console.log('');
    console.log('⚠️ Se o problema persistir:');
    console.log('1. Verifique se o Supabase foi reiniciado corretamente');
    console.log('2. Confirme que enable_confirmations = false no config.toml');
    console.log('3. Tente criar um novo usuário para testar');
  }
}

main().catch(console.error);