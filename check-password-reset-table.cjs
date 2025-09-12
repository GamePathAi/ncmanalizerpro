require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPasswordResetTable() {
  console.log('🔍 Verificando tabela password_reset_tokens...')
  
  try {
    // Tentar fazer uma query simples na tabela
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao acessar tabela:', error.message)
      
      if (error.message.includes('relation "password_reset_tokens" does not exist')) {
        console.log('\n📝 A tabela password_reset_tokens não existe!')
        console.log('Vou criar a tabela agora...')
        
        // Criar a tabela
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              email TEXT NOT NULL,
              token TEXT NOT NULL UNIQUE,
              expires_at TIMESTAMPTZ NOT NULL,
              used BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Índices para performance
            CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
            CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
            CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
          `
        })
        
        if (createError) {
          console.error('❌ Erro ao criar tabela:', createError)
        } else {
          console.log('✅ Tabela password_reset_tokens criada com sucesso!')
        }
      }
    } else {
      console.log('✅ Tabela password_reset_tokens existe e está acessível')
      console.log('Registros encontrados:', data?.length || 0)
    }
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkPasswordResetTable()