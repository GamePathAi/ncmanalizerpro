import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('URL:', supabaseUrl ? '✅' : '❌');
  console.log('Key:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDirectDatabase() {
  console.log('🔍 Testando acesso direto ao banco de dados...');
  
  try {
    // 1. Testar inserção direta na user_profiles com UUID válido
    console.log('\n1️⃣ Testando inserção direta na user_profiles...');
    const testId = crypto.randomUUID();
    const testEmail = `direct-test-${Date.now()}@example.com`;
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testId,
        email: testEmail,
        full_name: 'Direct Test User',
        subscription_type: 'free',
        subscription_status: 'active'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Erro na inserção direta:', insertError.message);
      console.log('📝 Detalhes:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Inserção direta bem-sucedida:', insertData);
      
      // Limpar o teste
      await supabase.from('user_profiles').delete().eq('id', testId);
      console.log('🧹 Registro de teste removido');
    }
    
    // 2. Verificar se existem triggers ativos
    console.log('\n2️⃣ Verificando triggers via SQL...');
    const { data: triggerData, error: triggerError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          trigger_name, 
          event_manipulation, 
          action_statement,
          action_timing
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth';
      `
    });
    
    if (triggerError) {
      console.log('⚠️ Não foi possível verificar triggers:', triggerError.message);
    } else {
      console.log('📋 Triggers encontrados:', triggerData?.length || 0);
      if (triggerData && triggerData.length > 0) {
        triggerData.forEach(trigger => {
          console.log(`  - ${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})`);
        });
      }
    }
    
    // 3. Verificar se a função existe
    console.log('\n3️⃣ Verificando funções...');
    const { data: functionData, error: functionError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          routine_name,
          routine_type
        FROM information_schema.routines 
        WHERE routine_name LIKE '%handle_new_user%' 
        OR routine_name LIKE '%send_confirmation%';
      `
    });
    
    if (functionError) {
      console.log('⚠️ Não foi possível verificar funções:', functionError.message);
    } else {
      console.log('🔧 Funções encontradas:', functionData?.length || 0);
      if (functionData && functionData.length > 0) {
        functionData.forEach(func => {
          console.log(`  - ${func.routine_name} (${func.routine_type})`);
        });
      }
    }
    
    // 4. Verificar configurações de auth
    console.log('\n4️⃣ Verificando configurações de auth...');
    const { data: authConfig, error: authError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          name,
          setting
        FROM pg_settings 
        WHERE name LIKE '%auth%' 
        OR name LIKE '%hook%'
        LIMIT 10;
      `
    });
    
    if (authError) {
      console.log('⚠️ Não foi possível verificar configurações:', authError.message);
    } else {
      console.log('⚙️ Configurações relevantes:', authConfig?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testDirectDatabase();