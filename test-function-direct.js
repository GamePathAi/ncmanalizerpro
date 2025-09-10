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

async function testFunctionDirect() {
  console.log('🧪 Testando função handle_new_user diretamente...');
  
  try {
    // 1. Verificar se a função existe
    console.log('1. Verificando se a função existe...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_name', 'handle_new_user');
    
    if (funcError) {
      console.error('❌ Erro ao verificar função:', funcError.message);
    } else {
      console.log('✅ Função encontrada:', functions);
    }
    
    // 2. Verificar estrutura da tabela user_profiles
    console.log('\n2. Verificando estrutura da tabela user_profiles...');
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'user_profiles')
      .eq('table_schema', 'public');
    
    if (colError) {
      console.error('❌ Erro ao verificar colunas:', colError.message);
    } else {
      console.log('✅ Colunas da tabela:');
      columns?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // 3. Verificar se há usuários na tabela auth.users
    console.log('\n3. Verificando usuários recentes em auth.users...');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (usersError) {
      console.log('⚠️ Não foi possível acessar auth.users (normal):', usersError.message);
    } else {
      console.log('✅ Usuários recentes:', users);
    }
    
    // 4. Verificar perfis existentes
    console.log('\n4. Verificando perfis existentes...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError.message);
    } else {
      console.log(`✅ Total de perfis: ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        profiles.forEach(profile => {
          console.log(`  - ID: ${profile.id}, Email: ${profile.email}, Nome: ${profile.full_name}`);
        });
      }
    }
    
    // 5. Tentar inserir um registro diretamente na tabela
    console.log('\n5. Testando inserção direta na tabela user_profiles...');
    const testId = crypto.randomUUID();
    const testEmail = `direct-test-${Date.now()}@test.com`;
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testId,
        email: testEmail,
        full_name: 'Teste Direto',
        subscription_type: 'free',
        subscription_status: 'active',
        totp_enabled: false
      })
      .select();
    
    if (insertError) {
      console.error('❌ Erro na inserção direta:', insertError.message);
      console.error('Código:', insertError.code);
      console.error('Detalhes:', insertError.details);
    } else {
      console.log('✅ Inserção direta funcionou!');
      console.log('Dados inseridos:', insertData);
      
      // Limpar o registro de teste
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testId);
      console.log('🧹 Registro de teste removido');
    }
    
    // 6. Verificar se RLS está ativo
    console.log('\n6. Verificando status do RLS...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename, rowsecurity')
      .eq('tablename', 'user_profiles');
    
    if (rlsError) {
      console.log('⚠️ Não foi possível verificar RLS:', rlsError.message);
    } else {
      console.log('✅ Status RLS:', rlsStatus);
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    console.error('Stack:', err.stack);
  }
}

testFunctionDirect();