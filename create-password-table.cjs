const fs = require('fs');
const https = require('https');

// Configurações do Supabase
const SUPABASE_URL = 'https://fsntzljufghutoyqxokm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVidW9jbm11aW9qaW5ldmd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5MDc5MCwiZXhwIjoyMDczMTY2NzkwfQ.Bz3rvJLhe-DMbgAohoHN2SlnPNQpnjwelhSNrqHISis';

// SQL para criar a tabela
const createTableSQL = `
-- Criar tabela para tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Habilitar RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de tokens (função Edge)
CREATE POLICY "Allow insert password reset tokens" ON password_reset_tokens
  FOR INSERT WITH CHECK (true);

-- Política para permitir leitura de tokens (função Edge)
CREATE POLICY "Allow read password reset tokens" ON password_reset_tokens
  FOR SELECT USING (true);

-- Política para permitir atualização de tokens (função Edge)
CREATE POLICY "Allow update password reset tokens" ON password_reset_tokens
  FOR UPDATE USING (true);
`;

async function executeSQL() {
  try {
    console.log('🔧 Criando tabela password_reset_tokens...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    // Executar cada comando SQL separadamente
    const commands = createTableSQL.split(';').filter(cmd => cmd.trim());
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (command) {
        console.log(`Executando comando ${i + 1}/${commands.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: command + ';'
          });
          
          if (error) {
            console.log(`⚠️ Erro no comando ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (cmdError) {
          console.log(`❌ Erro ao executar comando ${i + 1}:`, cmdError.message);
        }
      }
    }
    
    // Verificar se a tabela foi criada
    console.log('\n🔍 Verificando se a tabela foi criada...');
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Tabela não foi criada:', error.message);
    } else {
      console.log('✅ Tabela password_reset_tokens criada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

executeSQL();