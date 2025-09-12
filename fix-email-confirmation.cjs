const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function confirmUserEmailDirectly() {
  console.log('📧 CONFIRMANDO EMAIL DO USUÁRIO VIA SQL');
  console.log('=' .repeat(50));
  
  const targetEmail = 'gamepathai@gmail.com';
  
  try {
    // 1. Buscar o usuário primeiro
    console.log('🔍 Buscando usuário:', targetEmail);
    
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      return false;
    }
    
    const user = users.users.find(u => u.email === targetEmail);
    
    if (!user) {
      console.error('❌ Usuário não encontrado:', targetEmail);
      return false;
    }
    
    console.log('✅ Usuário encontrado!');
    console.log('- ID:', user.id);
    console.log('- Email confirmado antes:', user.email_confirmed_at ? 'SIM' : 'NÃO');
    
    // 2. Atualizar diretamente via SQL
    console.log('\n🔧 Confirmando email via SQL...');
    
    const { data: sqlData, error: sqlError } = await supabaseAdmin
      .from('auth.users')
      .update({ 
        email_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select();
    
    if (sqlError) {
      console.log('⚠️ Método SQL falhou:', sqlError.message);
      console.log('\n🔧 Tentando método alternativo...');
      
      // Método alternativo: usar RPC ou função SQL
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('confirm_user_email', {
        user_id: user.id
      });
      
      if (rpcError) {
        console.log('⚠️ Método RPC também falhou:', rpcError.message);
        console.log('\n🔧 Usando abordagem manual...');
        
        // Vamos tentar desabilitar temporariamente a confirmação
        console.log('\n💡 SOLUÇÃO ALTERNATIVA:');
        console.log('Vamos testar o login mesmo sem confirmação de email.');
        console.log('Para isso, vou mostrar como desabilitar temporariamente a confirmação.');
        
        return await testLoginWithoutConfirmation();
      }
    }
    
    console.log('✅ Email confirmado via SQL!');
    
    // 3. Verificar se funcionou
    const { data: updatedUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    const updatedUser = updatedUsers.users.find(u => u.id === user.id);
    
    console.log('- Email confirmado agora:', updatedUser.email_confirmed_at ? 'SIM' : 'NÃO');
    
    // 4. Testar login
    return await testLogin(targetEmail);
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
    return false;
  }
}

async function testLoginWithoutConfirmation() {
  console.log('\n🔐 TESTANDO LOGIN SEM CONFIRMAÇÃO...');
  console.log('=' .repeat(50));
  
  const supabaseClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
  
  const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: 'gamepathai@gmail.com',
    password: 'TestPassword123!'
  });
  
  if (loginError) {
    console.error('❌ Login ainda falha:', loginError.message);
    console.log('\n💡 SOLUÇÃO DEFINITIVA:');
    console.log('Para resolver este problema, você precisa:');
    console.log('1. Editar o arquivo supabase/config.toml');
    console.log('2. Alterar "enable_confirmations = true" para "enable_confirmations = false"');
    console.log('3. Reiniciar o Supabase local com: supabase stop && supabase start');
    console.log('4. Ou confirmar o email clicando no link que foi enviado para gamepathai@gmail.com');
    return false;
  }
  
  console.log('✅ Login realizado com sucesso!');
  return true;
}

async function testLogin(email) {
  console.log('\n🔐 TESTANDO LOGIN APÓS CONFIRMAÇÃO...');
  
  const supabaseClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
  
  const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: 'TestPassword123!'
  });
  
  if (loginError) {
    console.error('❌ Erro no login:', loginError.message);
    return false;
  }
  
  console.log('✅ Login realizado com sucesso!');
  console.log('- Usuário:', loginData.user?.email);
  console.log('- Email confirmado:', loginData.user?.email_confirmed_at ? 'SIM' : 'NÃO');
  console.log('- Access Token:', loginData.session?.access_token ? 'PRESENTE' : 'AUSENTE');
  
  return true;
}

async function main() {
  console.log('🎯 DIAGNÓSTICO DO PROBLEMA:');
  console.log('- Erro 400 "Invalid login credentials" no browser');
  console.log('- Usuário existe mas email não foi confirmado');
  console.log('- Supabase local exige confirmação (enable_confirmations = true)');
  console.log('');
  
  const success = await confirmUserEmailDirectly();
  
  if (success) {
    console.log('\n🎉 PROBLEMA RESOLVIDO!');
    console.log('Agora você pode fazer login no browser com:');
    console.log('- Email: gamepathai@gmail.com');
    console.log('- Senha: TestPassword123!');
  } else {
    console.log('\n⚠️ Veja as instruções acima para resolver o problema.');
  }
}

main().catch(console.error);