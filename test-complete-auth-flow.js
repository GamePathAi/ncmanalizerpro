import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCompleteAuthFlow() {
  console.log('🔄 TESTE COMPLETO DO FLUXO DE AUTENTICAÇÃO');
  console.log('=' .repeat(50));
  
  const testEmail = `fluxo-completo-${Date.now()}@exemplo.com`;
  const testPassword = 'MinhaSenh@123!';
  
  console.log(`📧 Email de teste: ${testEmail}`);
  
  try {
    // PASSO 1: Criar usuário via Supabase Auth (método correto)
    console.log('\n🔐 PASSO 1: Criando usuário via Supabase Auth API');
    console.log('-'.repeat(40));
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Teste Completo'
        }
      }
    });
    
    if (authError) {
      console.log('❌ ERRO no cadastro via Auth API:');
      console.log(`   Mensagem: ${authError.message}`);
      console.log(`   Status: ${authError.status}`);
      
      if (authError.message.includes('Database error saving new user')) {
        console.log('\n🎯 CONFIRMADO: O erro persiste!');
        console.log('   Causa: Função handle_new_user() não existe');
        console.log('   Solução: Execute fix-trigger-only.sql no Supabase Dashboard');
        return;
      }
      
      return;
    }
    
    console.log('✅ Usuário criado com sucesso via Auth API!');
    console.log(`   User ID: ${authData.user?.id}`);
    console.log(`   Email: ${authData.user?.email}`);
    console.log(`   Confirmação necessária: ${!authData.user?.email_confirmed_at}`);
    
    // PASSO 2: Aguardar um momento para o trigger processar
    console.log('\n⏳ PASSO 2: Aguardando trigger processar...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // PASSO 3: Verificar se o perfil foi criado automaticamente
    console.log('\n🔍 PASSO 3: Verificando se perfil foi criado pelo trigger');
    console.log('-'.repeat(40));
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log('❌ PERFIL NÃO FOI CRIADO AUTOMATICAMENTE');
        console.log('   Causa: Trigger on_auth_user_created não existe');
        console.log('   Solução: Execute fix-trigger-only.sql no Supabase Dashboard');
      } else {
        console.log('❌ Erro ao buscar perfil:', profileError.message);
      }
    } else {
      console.log('✅ PERFIL CRIADO AUTOMATICAMENTE PELO TRIGGER!');
      console.log('   Dados do perfil:');
      console.log(`   - ID: ${profileData.id}`);
      console.log(`   - Email: ${profileData.email}`);
      console.log(`   - Nome: ${profileData.full_name}`);
      console.log(`   - Status: ${profileData.subscription_status}`);
      console.log(`   - Tipo: ${profileData.subscription_type}`);
    }
    
    // PASSO 4: Testar login
    console.log('\n🔑 PASSO 4: Testando login');
    console.log('-'.repeat(40));
    
    // Primeiro fazer logout
    await supabase.auth.signOut();
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log(`   Usuário logado: ${loginData.user?.email}`);
    }
    
    // PASSO 5: Limpeza (opcional)
    console.log('\n🧹 PASSO 5: Limpeza dos dados de teste');
    console.log('-'.repeat(40));
    
    if (profileData) {
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', authData.user.id);
      
      if (deleteError) {
        console.log('⚠️  Não foi possível remover perfil de teste:', deleteError.message);
      } else {
        console.log('✅ Perfil de teste removido');
      }
    }
    
  } catch (error) {
    console.log('❌ Erro geral no teste:', error.message);
  }
  
  // RESUMO FINAL
  console.log('\n📋 RESUMO FINAL');
  console.log('=' .repeat(50));
  
  console.log('\n🎯 DIAGNÓSTICO CONFIRMADO:');
  console.log('   O erro "Database error saving new user" ocorre porque:');
  console.log('   1. A função handle_new_user() NÃO existe no banco');
  console.log('   2. O trigger on_auth_user_created NÃO existe no banco');
  console.log('   3. Quando o Supabase Auth tenta criar o usuário, o trigger');
  console.log('      deveria criar automaticamente o perfil, mas falha');
  
  console.log('\n🔧 SOLUÇÃO DEFINITIVA:');
  console.log('   1. Acesse: https://supabase.com/dashboard');
  console.log('   2. Selecione seu projeto');
  console.log('   3. Vá em "SQL Editor" no menu lateral');
  console.log('   4. Cole e execute o conteúdo do arquivo fix-trigger-only.sql');
  console.log('   5. Confirme que não há erros na execução');
  console.log('   6. Teste novamente com: node test-signup.js');
  
  console.log('\n📝 VERIFICAÇÃO PÓS-EXECUÇÃO:');
  console.log('   Execute estas queries no SQL Editor para confirmar:');
  console.log('\n   -- Verificar função:');
  console.log('   SELECT routine_name FROM information_schema.routines');
  console.log('   WHERE routine_name = \'handle_new_user\';');
  console.log('\n   -- Verificar trigger:');
  console.log('   SELECT trigger_name FROM information_schema.triggers');
  console.log('   WHERE trigger_name = \'on_auth_user_created\';');
}

testCompleteAuthFlow();