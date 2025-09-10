import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyTriggerCreation() {
  console.log('🔍 Verificando se a função e trigger foram criados...');
  
  try {
    // Verificar função handle_new_user
    const { data: functionData, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'handle_new_user');
    
    if (functionError) {
      console.log('❌ Erro ao verificar função:', functionError.message);
    } else {
      console.log('✅ Função handle_new_user:', functionData.length > 0 ? 'EXISTE' : 'NÃO EXISTE');
    }
    
    // Verificar trigger on_auth_user_created
    const { data: triggerData, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('trigger_name', 'on_auth_user_created');
    
    if (triggerError) {
      console.log('❌ Erro ao verificar trigger:', triggerError.message);
    } else {
      console.log('✅ Trigger on_auth_user_created:', triggerData.length > 0 ? 'EXISTE' : 'NÃO EXISTE');
    }
    
    // Verificar políticas RLS na tabela user_profiles
    console.log('\n🔒 Verificando políticas RLS...');
    const { data: policiesData, error: policiesError } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', 'user_profiles');
    
    if (policiesError) {
      console.log('❌ Erro ao verificar políticas:', policiesError.message);
    } else {
      console.log('📋 Políticas encontradas:', policiesData.length);
    }
    
    // Tentar inserir diretamente na tabela user_profiles para testar RLS
    console.log('\n🧪 Testando inserção direta na tabela user_profiles...');
    const testUserId = 'test-user-' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: 'teste-direto@exemplo.com',
        full_name: 'Teste Direto',
        subscription_type: 'pending',
        subscription_status: 'pending',
        totp_enabled: false
      });
    
    if (insertError) {
      console.log('❌ Erro na inserção direta:', insertError.message);
      console.log('🔍 Código do erro:', insertError.code);
      console.log('🔍 Detalhes:', insertError.details);
    } else {
      console.log('✅ Inserção direta bem-sucedida!');
      
      // Limpar o registro de teste
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId);
      console.log('🧹 Registro de teste removido.');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

verifyTriggerCreation();