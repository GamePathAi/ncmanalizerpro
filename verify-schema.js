import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('🔍 Verificando schema do Supabase...');
  
  try {
    // Verificar se a tabela user_profiles existe
    console.log('\n1. Verificando tabela user_profiles...');
    const { data: tableData, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Tabela user_profiles:', tableError.message);
    } else {
      console.log('✅ Tabela user_profiles existe e é acessível');
    }
    
    // Verificar estrutura da tabela
    console.log('\n2. Verificando estrutura da tabela...');
    const { data: structureData, error: structureError } = await supabase.rpc('get_table_structure', {
      table_name: 'user_profiles'
    });
    
    if (structureError) {
      console.log('⚠️ Não foi possível verificar estrutura:', structureError.message);
    } else {
      console.log('✅ Estrutura da tabela verificada');
    }
    
    // Verificar políticas RLS
    console.log('\n3. Verificando políticas RLS...');
    const { data: policiesData, error: policiesError } = await supabase.rpc('get_table_policies', {
      table_name: 'user_profiles'
    });
    
    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas:', policiesError.message);
    } else {
      console.log('✅ Políticas RLS verificadas');
    }
    
    // Testar inserção direta (simulando o que o trigger faria)
    console.log('\n4. Testando inserção direta na tabela...');
    const testId = crypto.randomUUID();
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testId,
        email: 'teste-direto@exemplo.com',
        full_name: 'Teste Direto'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Erro na inserção direta:', insertError.message);
      console.log('Detalhes:', insertError);
    } else {
      console.log('✅ Inserção direta funcionou');
      
      // Limpar o teste
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testId);
      console.log('🧹 Registro de teste removido');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verifySchema();