import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthConfig() {
  console.log('🔍 Verificando configuração do Supabase Auth...');
  
  try {
    // 1. Verificar se conseguimos acessar as configurações básicas
    console.log('\n1. Testando conexão básica...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao obter sessão:', sessionError.message);
    } else {
      console.log('✅ Conexão básica funcionando');
    }
    
    // 2. Verificar se a tabela auth.users existe e está acessível
    console.log('\n2. Verificando acesso à tabela auth.users...');
    try {
      // Tentar uma consulta simples na tabela auth (isso pode falhar por permissões)
      const { data: authData, error: authError } = await supabase
        .from('auth.users')
        .select('count')
        .limit(1);
      
      if (authError) {
        console.log('⚠️  Não conseguimos acessar auth.users diretamente (normal):', authError.message);
      } else {
        console.log('✅ Acesso à auth.users funcionando');
      }
    } catch (e) {
      console.log('⚠️  Erro esperado ao tentar acessar auth.users:', e.message);
    }
    
    // 3. Verificar se o trigger existe
    console.log('\n3. Verificando se trigger existe...');
    const { data: triggerData, error: triggerError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT COUNT(*) as trigger_count
          FROM information_schema.triggers 
          WHERE trigger_name = 'on_auth_user_created';
        `
      });
    
    if (triggerError) {
      console.log('❌ Erro ao verificar trigger (função exec_sql não existe):', triggerError.message);
      
      // Tentar método alternativo
      console.log('\n4. Tentando verificar trigger via query direta...');
      const { data: directData, error: directError } = await supabase
        .from('information_schema.triggers')
        .select('*')
        .eq('trigger_name', 'on_auth_user_created');
      
      if (directError) {
        console.log('❌ Também não conseguimos acessar information_schema:', directError.message);
      } else {
        console.log('✅ Trigger encontrado via query direta:', directData);
      }
    } else {
      console.log('✅ Trigger verificado via RPC:', triggerData);
    }
    
    // 4. Testar cadastro com dados mínimos
    console.log('\n5. Testando cadastro com dados mínimos...');
    const minimalEmail = `minimal-${Date.now()}@test.com`;
    
    const { data: minimalData, error: minimalError } = await supabase.auth.signUp({
      email: minimalEmail,
      password: 'Test123456!'
    });
    
    if (minimalError) {
      console.log('❌ Erro no cadastro mínimo:', minimalError.message);
      console.log('📋 Código de erro:', minimalError.status);
      console.log('📋 Tipo de erro:', minimalError.name);
      
      // Verificar se é um erro específico
      if (minimalError.message.includes('Database error')) {
        console.log('\n🔍 Erro de banco detectado. Possíveis causas:');
        console.log('- Trigger com erro na função handle_new_user');
        console.log('- Problema na estrutura da tabela user_profiles');
        console.log('- Configuração incorreta do Supabase Auth');
      }
    } else {
      console.log('✅ Cadastro mínimo funcionou!');
      console.log('📋 Usuário criado:', minimalData.user?.id);
    }
    
    // 5. Verificar logs do Supabase (se possível)
    console.log('\n6. Informações de debug:');
    console.log('📋 URL do Supabase:', supabaseUrl);
    console.log('📋 Chave (primeiros 20 chars):', supabaseKey.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('❌ Erro geral na verificação:', error);
  }
}

checkAuthConfig();