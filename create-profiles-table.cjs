const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createProfilesTable() {
  try {
    console.log('🔧 Criando tabela user_profiles...');
    
    const sql = `
      -- Criar tabela user_profiles se não existir
      CREATE TABLE IF NOT EXISTS public.user_profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT,
          full_name TEXT,
          subscription_type TEXT DEFAULT 'pending',
          subscription_status TEXT DEFAULT 'pending_email',
          stripe_customer_id TEXT,
          totp_enabled BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Habilitar RLS
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
      
      -- Política para usuários verem apenas seus próprios perfis
      DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
      CREATE POLICY "Users can view own profile" ON public.user_profiles
        FOR SELECT USING (auth.uid() = id);
      
      -- Política para usuários atualizarem apenas seus próprios perfis
      DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
      CREATE POLICY "Users can update own profile" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = id);
      
      -- Política para inserção de perfis
      DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
      CREATE POLICY "Users can insert own profile" ON public.user_profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      
      // Tentar método alternativo
      console.log('🔄 Tentando método alternativo...');
      
      const { error: directError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (directError && directError.message.includes('does not exist')) {
        console.log('❌ Tabela não existe. Executando SQL diretamente...');
        
        // Executar cada comando separadamente
        const commands = [
          `CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT,
            full_name TEXT,
            subscription_type TEXT DEFAULT 'pending',
            subscription_status TEXT DEFAULT 'pending_email',
            stripe_customer_id TEXT,
            totp_enabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );`,
          `ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;`
        ];
        
        for (const cmd of commands) {
          try {
            await supabase.rpc('exec_sql', { sql_query: cmd });
            console.log('✅ Comando executado com sucesso');
          } catch (cmdError) {
            console.log('⚠️ Erro no comando:', cmdError.message);
          }
        }
      }
    } else {
      console.log('✅ Tabela user_profiles criada com sucesso!');
    }
    
    // Verificar se a tabela foi criada
    const { data: tableCheck, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.log('❌ Tabela ainda não existe:', checkError.message);
    } else {
      console.log('✅ Tabela user_profiles confirmada!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createProfilesTable();