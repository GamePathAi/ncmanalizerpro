import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function setupFreshTOTP() {
  console.log('🚀 Configurando TOTP do zero com auth hook...');
  
  try {
    // 1. Verificar se a tabela user_profiles existe
    console.log('\n1. 🔍 Verificando estrutura do banco...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profiles');
    
    if (tablesError) {
      console.log('❌ Erro ao verificar tabelas:', tablesError.message);
    } else if (tables && tables.length > 0) {
      console.log('✅ Tabela user_profiles existe');
    } else {
      console.log('❌ Tabela user_profiles NÃO existe');
      console.log('\n📋 AÇÃO NECESSÁRIA:');
      console.log('Execute no Supabase Dashboard SQL Editor:');
      console.log(`
-- Criar tabela user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_type TEXT DEFAULT 'pending',
  subscription_status TEXT DEFAULT 'pending',
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT FALSE,
  totp_backup_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);`);
      return;
    }
    
    // 2. Verificar auth hook
    console.log('\n2. 🔍 Verificando auth hook...');
    
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'custom_access_token_hook');
    
    if (functionsError) {
      console.log('❌ Erro ao verificar funções:', functionsError.message);
    } else if (functions && functions.length > 0) {
      console.log('✅ Auth hook custom_access_token_hook existe');
    } else {
      console.log('❌ Auth hook NÃO encontrado');
    }
    
    // 3. Testar inserção de perfil
    console.log('\n3. 🧪 Testando criação de perfil...');
    
    const testEmail = `test-${Date.now()}@exemplo.com`;
    const testUserId = crypto.randomUUID();
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        full_name: 'Usuário Teste',
        totp_enabled: false
      })
      .select();
    
    if (insertError) {
      console.log('❌ Erro ao inserir perfil de teste:', insertError.message);
    } else {
      console.log('✅ Perfil de teste criado com sucesso!');
      console.log('📄 Dados:', insertData);
      
      // Limpar teste
      await supabase.from('user_profiles').delete().eq('id', testUserId);
      console.log('🧹 Perfil de teste removido');
    }
    
    // 4. Verificar campos TOTP
    console.log('\n4. 🔍 Verificando campos TOTP...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profiles')
      .in('column_name', ['totp_secret', 'totp_enabled', 'totp_backup_codes']);
    
    if (columnsError) {
      console.log('❌ Erro ao verificar colunas:', columnsError.message);
    } else {
      const foundColumns = columns?.map(c => c.column_name) || [];
      const requiredColumns = ['totp_secret', 'totp_enabled', 'totp_backup_codes'];
      const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('✅ Todos os campos TOTP estão presentes!');
      } else {
        console.log('❌ Campos TOTP faltando:', missingColumns.join(', '));
        console.log('\n📋 Execute no Supabase Dashboard:');
        missingColumns.forEach(col => {
          if (col === 'totp_secret') {
            console.log(`ALTER TABLE public.user_profiles ADD COLUMN ${col} TEXT;`);
          } else if (col === 'totp_enabled') {
            console.log(`ALTER TABLE public.user_profiles ADD COLUMN ${col} BOOLEAN DEFAULT FALSE;`);
          } else if (col === 'totp_backup_codes') {
            console.log(`ALTER TABLE public.user_profiles ADD COLUMN ${col} TEXT[];`);
          }
        });
      }
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Certifique-se de que a tabela user_profiles existe');
    console.log('2. Implemente o auth hook para incluir dados TOTP no token');
    console.log('3. Teste o fluxo completo de TOTP');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

setupFreshTOTP();