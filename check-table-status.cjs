const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStatus() {
  console.log('🔍 Verificando status da tabela password_reset_tokens...');
  
  try {
    // 1. Verificar se a tabela existe
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'password_reset_tokens');
    
    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.log('❌ Tabela password_reset_tokens não existe');
      return;
    }
    
    console.log('✅ Tabela password_reset_tokens existe');
    
    // 2. Verificar estrutura da tabela
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'password_reset_tokens')
      .order('ordinal_position');
    
    if (columnError) {
      console.error('❌ Erro ao verificar colunas:', columnError);
      return;
    }
    
    console.log('\n📋 Estrutura da tabela:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 3. Verificar índices
    const { data: indexes, error: indexError } = await supabase
      .from('pg_indexes')
      .select('indexname, indexdef')
      .eq('schemaname', 'public')
      .eq('tablename', 'password_reset_tokens');
    
    if (indexError) {
      console.error('❌ Erro ao verificar índices:', indexError);
    } else {
      console.log('\n🔗 Índices encontrados:');
      indexes.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
    }
    
    // 4. Verificar políticas RLS
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual')
      .eq('schemaname', 'public')
      .eq('tablename', 'password_reset_tokens');
    
    if (policyError) {
      console.error('❌ Erro ao verificar políticas:', policyError);
    } else {
      console.log('\n🔒 Políticas RLS encontradas:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }
    
    // 5. Verificar triggers
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing')
      .eq('event_object_schema', 'public')
      .eq('event_object_table', 'password_reset_tokens');
    
    if (triggerError) {
      console.error('❌ Erro ao verificar triggers:', triggerError);
    } else {
      console.log('\n⚡ Triggers encontrados:');
      triggers.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})`);
      });
    }
    
    // 6. Contar registros na tabela
    const { count, error: countError } = await supabase
      .from('password_reset_tokens')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
    } else {
      console.log(`\n📊 Total de registros: ${count}`);
    }
    
    // 7. Verificar se há duplicações de políticas ou índices
    console.log('\n🔍 Verificando duplicações...');
    
    // Verificar duplicação de índices
    const indexNames = indexes.map(idx => idx.indexname);
    const duplicateIndexes = indexNames.filter((name, index) => indexNames.indexOf(name) !== index);
    
    if (duplicateIndexes.length > 0) {
      console.log('⚠️ Índices duplicados encontrados:', duplicateIndexes);
    } else {
      console.log('✅ Nenhum índice duplicado encontrado');
    }
    
    // Verificar duplicação de políticas
    const policyNames = policies.map(policy => policy.policyname);
    const duplicatePolicies = policyNames.filter((name, index) => policyNames.indexOf(name) !== index);
    
    if (duplicatePolicies.length > 0) {
      console.log('⚠️ Políticas duplicadas encontradas:', duplicatePolicies);
    } else {
      console.log('✅ Nenhuma política duplicada encontrada');
    }
    
    console.log('\n✅ Verificação completa!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTableStatus();