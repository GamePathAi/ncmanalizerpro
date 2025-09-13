const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela user_profiles...');
    
    // Tentar buscar qualquer registro para ver as colunas
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Estrutura da tabela user_profiles:');
      console.log('Colunas encontradas:', Object.keys(data[0]));
      console.log('Exemplo de registro:', data[0]);
    } else {
      console.log('📋 Tabela existe mas está vazia');
      
      // Tentar inserir um registro de teste para ver a estrutura
      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({})
        .select();
        
      if (insertError) {
        console.log('Erro ao inserir teste:', insertError.message);
        console.log('Detalhes:', insertError.details);
        console.log('Hint:', insertError.hint);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkTableStructure();