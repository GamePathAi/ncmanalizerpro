const { createClient } = require('@supabase/supabase-js');

// Usando as configurações corretas do .env
const supabaseUrl = 'https://fsntzljufghutoyqxokm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTY0MDEsImV4cCI6MjA2OTE3MjQwMX0.MTkYFy_FfnGOiHrDVjV3AWDYao8YLQf1TnnBWeJwG-I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Verificando banco de dados atual...');
  console.log('URL:', supabaseUrl);
  
  try {
    // Verificar conexão básica
    const { data: testData, error: testError } = await supabase
      .from('auth.users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro na conexão:', testError.message);
      
      // Tentar listar tabelas públicas
      const { data: tables, error: tableError } = await supabase
        .rpc('get_public_tables');
      
      if (tableError) {
        console.log('❌ Erro ao listar tabelas:', tableError.message);
        
        // Tentar uma consulta mais simples
        const { data: simpleTest, error: simpleError } = await supabase
          .from('password_reset_tokens')
          .select('count')
          .limit(1);
        
        if (simpleError) {
          console.log('❌ Tabela password_reset_tokens não existe ou sem acesso:', simpleError.message);
        } else {
          console.log('✅ Tabela password_reset_tokens existe e acessível');
        }
      }
    } else {
      console.log('✅ Conexão com Supabase estabelecida');
    }
    
    // Verificar especificamente a tabela password_reset_tokens
    console.log('\n🔍 Verificando tabela password_reset_tokens...');
    
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .limit(5);
    
    if (tokenError) {
      console.log('❌ Erro ao acessar password_reset_tokens:', tokenError.message);
      
      if (tokenError.message.includes('does not exist')) {
        console.log('\n📋 A tabela password_reset_tokens NÃO EXISTE no banco atual');
        console.log('\n💡 Você precisa executar a migration SQL para criar a tabela.');
        console.log('\n📝 Execute o arquivo: supabase/migrations/20250116000001_create_password_reset_tokens.sql');
      }
    } else {
      console.log('✅ Tabela password_reset_tokens existe');
      console.log('📊 Registros encontrados:', tokenData.length);
      
      if (tokenData.length > 0) {
        console.log('\n📋 Primeiros registros:');
        tokenData.forEach((record, index) => {
          console.log(`  ${index + 1}. Token: ${record.token.substring(0, 20)}... | Email: ${record.email} | Usado: ${record.used}`);
        });
      }
    }
    
    // Listar todas as tabelas disponíveis
    console.log('\n📋 Tentando listar tabelas disponíveis...');
    
    // Método alternativo para listar tabelas
    const { data: allTables, error: allTablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (allTablesError) {
      console.log('❌ Não foi possível listar tabelas:', allTablesError.message);
    } else {
      console.log('✅ Tabelas públicas encontradas:');
      allTables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkDatabase();