require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Definida' : '❌ Não definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela user_profiles...');
    
    // Tentar buscar um registro para ver a estrutura
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao consultar tabela:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Estrutura da tabela user_profiles:');
      console.log('Campos disponíveis:', Object.keys(data[0]));
      console.log('Exemplo de registro:', data[0]);
    } else {
      console.log('⚠️ Tabela existe mas está vazia');
      
      // Tentar obter estrutura via RPC ou query direta
      const { data: columns } = await supabase.rpc('get_table_columns', { table_name: 'user_profiles' });
      if (columns) {
        console.log('Colunas da tabela:', columns);
      }
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

checkUserTable();