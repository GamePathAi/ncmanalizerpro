import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura da tabela user_profiles...');
  
  try {
    // Tentar buscar um registro para ver a estrutura
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao acessar tabela:', error.message);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Estrutura da tabela user_profiles:');
      console.log('📋 Colunas disponíveis:', Object.keys(profiles[0]).join(', '));
      console.log('\n📊 Exemplo de registro:');
      console.log(JSON.stringify(profiles[0], null, 2));
    } else {
      console.log('⚠️ Tabela existe mas não há registros.');
      console.log('Vou tentar uma consulta vazia para ver a estrutura...');
      
      // Tentar uma consulta que retorna estrutura vazia
      const { data: emptyData, error: emptyError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000'); // ID que não existe
      
      if (emptyError) {
        console.log('❌ Erro na consulta vazia:', emptyError.message);
      } else {
        console.log('✅ Consulta vazia executada com sucesso');
        console.log('📋 Estrutura inferida da resposta vazia');
      }
    }
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err.message);
  }
}

checkTableStructure();