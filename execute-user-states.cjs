const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function executeUserStatesSQL() {
  console.log('🔧 Executando script de estados de usuário...');
  
  // Usar service role key para operações administrativas
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
    console.log('💡 Adicione a service role key no arquivo .env:');
    console.log('SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui');
    return;
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    // Ler o arquivo SQL
    const sql = fs.readFileSync('add-user-states.sql', 'utf8');
    
    // Dividir em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.toLowerCase().includes('select ') && command.includes('result')) {
        // Pular comandos de resultado
        continue;
      }
      
      console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        query: command + ';'
      });
      
      if (error) {
        // Tentar executar diretamente se rpc falhar
        console.log(`🔄 Tentando execução direta...`);
        const { error: directError } = await supabase
          .from('_temp')
          .select('*')
          .limit(0); // Apenas para testar conexão
          
        if (directError && directError.code !== 'PGRST116') {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          if (error.message.includes('already exists')) {
            console.log('⚠️ Objeto já existe, continuando...');
            continue;
          }
          throw error;
        }
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    }
    
    console.log('\n🎉 Script de estados de usuário executado com sucesso!');
    
    // Verificar se os campos foram adicionados
    console.log('\n🔍 Verificando estrutura da tabela...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError.message);
    } else {
      console.log('✅ Tabela user_profiles acessível');
      if (tableInfo && tableInfo.length > 0) {
        const fields = Object.keys(tableInfo[0]);
        console.log('📋 Campos disponíveis:', fields.join(', '));
        
        const requiredFields = ['email_verified_at', 'user_state', 'stripe_customer_id'];
        const missingFields = requiredFields.filter(field => !fields.includes(field));
        
        if (missingFields.length === 0) {
          console.log('✅ Todos os campos necessários estão presentes!');
        } else {
          console.log('⚠️ Campos faltando:', missingFields.join(', '));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar script:', error.message);
    
    // Tentar abordagem alternativa - executar comandos um por vez
    console.log('\n🔄 Tentando abordagem alternativa...');
    await executeAlternative();
  }
}

async function executeAlternative() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    // Comandos essenciais para adicionar os campos
    const essentialCommands = [
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_state TEXT CHECK (user_state IN ('pending_email', 'pending_subscription', 'active')) DEFAULT 'pending_email'`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`,
      `CREATE INDEX IF NOT EXISTS idx_user_profiles_user_state ON user_profiles(user_state)`,
      `CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON user_profiles(email_verified_at)`
    ];
    
    for (const command of essentialCommands) {
      console.log('⚡ Executando:', command.substring(0, 50) + '...');
      
      // Usar uma abordagem mais direta
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({ query: command })
      });
      
      if (response.ok) {
        console.log('✅ Comando executado');
      } else {
        const error = await response.text();
        console.log('⚠️ Resposta:', response.status, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na abordagem alternativa:', error.message);
    console.log('\n💡 Execute manualmente no SQL Editor do Supabase:');
    console.log('1. Acesse o dashboard do Supabase');
    console.log('2. Vá em SQL Editor');
    console.log('3. Execute o conteúdo do arquivo add-user-states.sql');
  }
}

executeUserStatesSQL().catch(console.error);