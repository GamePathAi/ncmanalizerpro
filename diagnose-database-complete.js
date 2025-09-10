import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Cliente com service role para verificações administrativas
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseDatabaseComplete() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO BANCO DE DADOS');
  console.log('=' .repeat(50));
  
  // 1. Verificar tabelas existentes
  console.log('\n📋 1. VERIFICANDO TABELAS EXISTENTES');
  console.log('-'.repeat(30));
  
  try {
    // Verificar tabela user_profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true });
    
    if (profilesError) {
      console.log('❌ Tabela user_profiles:', profilesError.message);
    } else {
      console.log('✅ Tabela user_profiles: EXISTE');
      console.log(`   📊 Total de registros: ${profilesData || 0}`);
    }
    
    // Verificar estrutura da tabela user_profiles
    console.log('\n🏗️  Estrutura da tabela user_profiles:');
    const { data: sampleProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (sampleProfile && sampleProfile.length > 0) {
      console.log('   Campos encontrados:', Object.keys(sampleProfile[0]).join(', '));
    } else {
      console.log('   📭 Tabela vazia - não é possível verificar estrutura');
    }
    
  } catch (error) {
    console.log('❌ Erro ao verificar tabelas:', error.message);
  }
  
  // 2. Verificar usuários em auth.users (se possível)
  console.log('\n👥 2. VERIFICANDO USUÁRIOS EXISTENTES');
  console.log('-'.repeat(30));
  
  try {
    // Tentar buscar usuários recentes (últimos 5)
    const testEmails = [
      'teste1757440915836@exemplo.com', // último teste
      'trigger-test-1757440437514@exemplo.com', // teste do trigger
      'teste@exemplo.com' // teste genérico
    ];
    
    for (const email of testEmails) {
      console.log(`\n🔍 Buscando usuário: ${email}`);
      
      // Verificar se existe perfil para este email
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.log(`   ❌ Erro ao buscar perfil: ${profileError.message}`);
      } else if (profileData) {
        console.log(`   ✅ Perfil encontrado:`);
        console.log(`      ID: ${profileData.id}`);
        console.log(`      Nome: ${profileData.full_name}`);
        console.log(`      Status: ${profileData.subscription_status}`);
      } else {
        console.log(`   📭 Nenhum perfil encontrado para este email`);
      }
    }
    
  } catch (error) {
    console.log('❌ Erro ao verificar usuários:', error.message);
  }
  
  // 3. Testar inserção direta com diferentes métodos
  console.log('\n🧪 3. TESTANDO INSERÇÃO DIRETA');
  console.log('-'.repeat(30));
  
  const testUserId = crypto.randomUUID();
  const testEmail = `diagnostico-${Date.now()}@exemplo.com`;
  
  try {
    console.log(`\n🔄 Tentando inserir usuário de teste: ${testEmail}`);
    
    // Teste 1: Inserção com cliente normal
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        full_name: 'Usuário Diagnóstico',
        subscription_type: 'pending',
        subscription_status: 'pending',
        totp_enabled: false
      })
      .select();
    
    if (insertError) {
      console.log('❌ Inserção com cliente normal falhou:');
      console.log(`   Mensagem: ${insertError.message}`);
      console.log(`   Código: ${insertError.code}`);
      console.log(`   Detalhes: ${insertError.details}`);
      console.log(`   Hint: ${insertError.hint || 'N/A'}`);
      
      // Analisar tipo de erro
      if (insertError.code === '42501') {
        console.log('\n🔒 DIAGNÓSTICO: Erro de permissão (RLS)');
        console.log('   Possíveis causas:');
        console.log('   - Políticas RLS muito restritivas');
        console.log('   - Falta de política INSERT para role anon/authenticated');
        console.log('   - Contexto de autenticação ausente');
      } else if (insertError.code === '23505') {
        console.log('\n🔄 DIAGNÓSTICO: Violação de constraint única');
        console.log('   Possíveis causas:');
        console.log('   - ID ou email já existe');
        console.log('   - Constraint de unicidade violada');
      } else if (insertError.code === '23503') {
        console.log('\n🔗 DIAGNÓSTICO: Violação de foreign key');
        console.log('   Possíveis causas:');
        console.log('   - ID não existe na tabela auth.users');
        console.log('   - Constraint de FK não satisfeita');
      }
      
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('   Dados inseridos:', insertData);
      
      // Limpar dados de teste
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId);
      console.log('🧹 Dados de teste removidos.');
    }
    
  } catch (error) {
    console.log('❌ Erro geral na inserção:', error.message);
  }
  
  // 4. Verificar configurações RLS
  console.log('\n🔒 4. VERIFICANDO CONFIGURAÇÕES RLS');
  console.log('-'.repeat(30));
  
  try {
    // Tentar uma operação que normalmente falha com RLS
    const { data: rlsTest, error: rlsError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true });
    
    if (rlsError) {
      console.log('❌ RLS pode estar bloqueando SELECT:', rlsError.message);
    } else {
      console.log('✅ SELECT funcionando - RLS permite leitura');
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar RLS:', error.message);
  }
  
  // 5. Resumo e recomendações
  console.log('\n📋 5. RESUMO E RECOMENDAÇÕES');
  console.log('=' .repeat(50));
  
  console.log('\n🎯 CAUSA MAIS PROVÁVEL DO ERRO:');
  console.log('   A função handle_new_user() e o trigger on_auth_user_created');
  console.log('   NÃO foram criados no banco de dados.');
  
  console.log('\n🔧 SOLUÇÃO OBRIGATÓRIA:');
  console.log('   1. Acesse o Supabase Dashboard');
  console.log('   2. Vá em SQL Editor');
  console.log('   3. Execute o script fix-trigger-only.sql');
  console.log('   4. Confirme que função e trigger foram criados');
  
  console.log('\n📝 QUERIES PARA EXECUTAR NO SUPABASE (SQL Editor):');
  console.log('\n-- Verificar se função existe:');
  console.log(`SELECT routine_name FROM information_schema.routines `);
  console.log(`WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';`);
  
  console.log('\n-- Verificar se trigger existe:');
  console.log(`SELECT trigger_name FROM information_schema.triggers `);
  console.log(`WHERE trigger_name = 'on_auth_user_created';`);
  
  console.log('\n-- Listar políticas RLS:');
  console.log(`SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual `);
  console.log(`FROM pg_policies WHERE tablename = 'user_profiles';`);
}

diagnoseDatabaseComplete();