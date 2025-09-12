const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTriggerStatus() {
  console.log('🔍 Verificando status do trigger e função...');
  
  try {
    // Verificar se a função existe
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'handle_new_user');
    
    console.log('📋 Função handle_new_user:', functions?.length > 0 ? '✅ EXISTE' : '❌ NÃO EXISTE');
    
    // Verificar se o trigger existe
    const { data: triggers, error: trigError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('trigger_name', 'on_auth_user_created');
    
    console.log('🔧 Trigger on_auth_user_created:', triggers?.length > 0 ? '✅ EXISTE' : '❌ NÃO EXISTE');
    
    // Verificar políticas RLS
    const { data: policies, error: polError } = await supabase
      .from('pg_policies')
      .select('policyname')
      .eq('tablename', 'user_profiles');
    
    console.log('🔒 Políticas RLS na user_profiles:', policies?.length || 0);
    if (policies?.length > 0) {
      policies.forEach(p => console.log('  -', p.policyname));
    }
    
    // Verificar se RLS está habilitado
    const { data: tables, error: tableError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'user_profiles');
    
    console.log('🛡️ RLS habilitado:', tables?.[0]?.rowsecurity ? '✅ SIM' : '❌ NÃO');
    
  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
  }
}

checkTriggerStatus();