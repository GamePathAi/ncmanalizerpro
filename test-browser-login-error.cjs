const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar exatamente as mesmas configurações do frontend
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('🔧 CONFIGURAÇÕES DO TESTE:');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
console.log('');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBrowserLoginError() {
  console.log('🔍 REPRODUZINDO ERRO 400 DO BROWSER');
  console.log('=' .repeat(50));
  
  const testEmail = 'gamepathai@gmail.com';
  const testPassword = 'TestPassword123!';
  
  try {
    console.log('📧 Testando login com:', testEmail);
    console.log('🔒 Senha:', testPassword.replace(/./g, '*'));
    console.log('');
    
    console.log('🔄 Executando supabase.auth.signInWithPassword...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.log('❌ ERRO CAPTURADO:');
      console.log('- Mensagem:', error.message);
      console.log('- Status:', error.status);
      console.log('- Nome:', error.name);
      console.log('- Detalhes completos:', JSON.stringify(error, null, 2));
      
      // Analisar tipos específicos de erro
      if (error.status === 400) {
        console.log('\n🎯 DIAGNÓSTICO: Erro 400 Bad Request');
        console.log('Possíveis causas:');
        console.log('1. Parâmetros inválidos na requisição');
        console.log('2. Email ou senha em formato incorreto');
        console.log('3. Problema na configuração do Supabase local');
        console.log('4. Usuário não existe ou não está confirmado');
      }
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n🎯 DIAGNÓSTICO: Credenciais inválidas');
        console.log('- Verificar se o usuário existe');
        console.log('- Verificar se a senha está correta');
        console.log('- Verificar se o email foi confirmado');
      }
      
      return false;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', data.user?.email);
    console.log('🆔 ID:', data.user?.id);
    console.log('📧 Email confirmado:', data.user?.email_confirmed_at ? 'SIM' : 'NÃO');
    console.log('🔑 Access Token:', data.session?.access_token ? 'PRESENTE' : 'AUSENTE');
    
    return true;
    
  } catch (err) {
    console.log('❌ ERRO GERAL:', err.message);
    console.log('Stack:', err.stack);
    return false;
  }
}

async function checkUserExists() {
  console.log('\n👤 VERIFICANDO SE USUÁRIO EXISTE');
  console.log('=' .repeat(50));
  
  try {
    // Usar service role para verificar usuário
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: users, error } = await adminClient.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ Erro ao listar usuários:', error.message);
      return;
    }
    
    const targetUser = users.users.find(u => u.email === 'gamepathai@gmail.com');
    
    if (targetUser) {
      console.log('✅ Usuário encontrado!');
      console.log('- ID:', targetUser.id);
      console.log('- Email:', targetUser.email);
      console.log('- Email confirmado:', targetUser.email_confirmed_at ? 'SIM' : 'NÃO');
      console.log('- Criado em:', targetUser.created_at);
      console.log('- Último login:', targetUser.last_sign_in_at || 'Nunca');
    } else {
      console.log('❌ Usuário não encontrado!');
      console.log('Usuários existentes:');
      users.users.forEach(u => {
        console.log(`- ${u.email} (${u.email_confirmed_at ? 'confirmado' : 'não confirmado'})`);
      });
    }
    
  } catch (err) {
    console.log('❌ Erro ao verificar usuário:', err.message);
  }
}

async function main() {
  await checkUserExists();
  await testBrowserLoginError();
}

main().catch(console.error);