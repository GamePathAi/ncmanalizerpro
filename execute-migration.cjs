const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase com service role
const supabaseUrl = 'https://fsntzljufghutoyqxokm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU5NjQwMSwiZXhwIjoyMDY5MTcyNDAxfQ.YOUR_SERVICE_ROLE_KEY_HERE';

// Vou usar a chave anon por enquanto para testar
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTY0MDEsImV4cCI6MjA2OTE3MjQwMX0.MTkYFy_FfnGOiHrDVjV3AWDYao8YLQf1TnnBWeJwG-I';

const supabase = createClient(supabaseUrl, anonKey);

async function executeMigration() {
  console.log('🚀 Executando migration para criar tabela password_reset_tokens...');
  console.log('URL:', supabaseUrl);
  
  try {
    // Ler o arquivo de migration
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250116000001_create_password_reset_tokens.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Arquivo de migration não encontrado:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Arquivo de migration carregado');
    console.log('📄 Tamanho do SQL:', migrationSQL.length, 'caracteres');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log('📋 Total de comandos SQL:', commands.length);
    
    // Executar cada comando individualmente
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.toLowerCase().includes('create table')) {
        console.log(`\n🔨 Executando comando ${i + 1}: CREATE TABLE...`);
      } else if (command.toLowerCase().includes('create index')) {
        console.log(`\n🔗 Executando comando ${i + 1}: CREATE INDEX...`);
      } else if (command.toLowerCase().includes('create trigger')) {
        console.log(`\n⚡ Executando comando ${i + 1}: CREATE TRIGGER...`);
      } else if (command.toLowerCase().includes('create policy')) {
        console.log(`\n🔒 Executando comando ${i + 1}: CREATE POLICY...`);
      } else {
        console.log(`\n📝 Executando comando ${i + 1}:`, command.substring(0, 50) + '...');
      }
      
      try {
        // Tentar executar via RPC
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });
        
        if (error) {
          console.log(`❌ Erro no comando ${i + 1}:`, error.message);
          
          // Se o erro for sobre a função não existir, tentar método alternativo
          if (error.message.includes('exec_sql')) {
            console.log('💡 Tentando método alternativo...');
            
            // Para comandos CREATE TABLE, tentar via REST API
            if (command.toLowerCase().includes('create table password_reset_tokens')) {
              console.log('🔨 Criando tabela via método alternativo...');
              
              // Criar a tabela manualmente usando o cliente Supabase
              const createResult = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${anonKey}`,
                  'apikey': anonKey
                },
                body: JSON.stringify({
                  sql: command + ';'
                })
              });
              
              if (createResult.ok) {
                console.log('✅ Tabela criada com sucesso');
              } else {
                const errorText = await createResult.text();
                console.log('❌ Erro ao criar tabela:', errorText);
              }
            }
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      } catch (cmdError) {
        console.log(`❌ Erro no comando ${i + 1}:`, cmdError.message);
      }
    }
    
    // Verificar se a tabela foi criada
    console.log('\n🔍 Verificando se a tabela foi criada...');
    
    const { data: checkData, error: checkError } = await supabase
      .from('password_reset_tokens')
      .select('count')
      .limit(1);
    
    if (checkError) {
      console.log('❌ Tabela ainda não existe:', checkError.message);
      
      console.log('\n💡 INSTRUÇÕES MANUAIS:');
      console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Vá para SQL Editor');
      console.log('3. Execute o conteúdo do arquivo: supabase/migrations/20250116000001_create_password_reset_tokens.sql');
      console.log('4. Ou execute os comandos SQL um por vez');
      
    } else {
      console.log('✅ Tabela password_reset_tokens criada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    
    console.log('\n💡 SOLUÇÃO ALTERNATIVA:');
    console.log('Execute manualmente no Supabase Dashboard o SQL:');
    console.log('\nCREATE TABLE IF NOT EXISTS password_reset_tokens (');
    console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,');
    console.log('    email TEXT NOT NULL,');
    console.log('    token TEXT NOT NULL UNIQUE,');
    console.log('    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,');
    console.log('    used BOOLEAN DEFAULT FALSE,');
    console.log('    used_at TIMESTAMP WITH TIME ZONE,');
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
  }
}

executeMigration();