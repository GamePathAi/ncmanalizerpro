import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTrigger() {
  console.log('🔧 Criando trigger handle_new_user...');
  
  try {
    // 1. Remover trigger existente
    console.log('1. Removendo trigger existente...');
    const { error: dropTriggerError } = await supabase.rpc('drop_trigger_if_exists', {
      trigger_name: 'on_auth_user_created',
      table_name: 'auth.users'
    });
    
    if (dropTriggerError && !dropTriggerError.message.includes('does not exist')) {
      console.log('⚠️ Aviso ao remover trigger:', dropTriggerError.message);
    }
    
    // 2. Remover função existente
    console.log('2. Removendo função existente...');
    const { error: dropFunctionError } = await supabase.rpc('drop_function_if_exists', {
      function_name: 'handle_new_user'
    });
    
    if (dropFunctionError && !dropFunctionError.message.includes('does not exist')) {
      console.log('⚠️ Aviso ao remover função:', dropFunctionError.message);
    }
    
    // 3. Criar função usando SQL direto
    console.log('3. Criando função handle_new_user...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
          INSERT INTO public.user_profiles (
              id,
              email,
              full_name,
              subscription_type,
              subscription_status,
              totp_enabled,
              created_at,
              updated_at
          )
          VALUES (
              NEW.id,
              NEW.email,
              COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
              'free',
              'active',
              FALSE,
              NOW(),
              NOW()
          );
          RETURN NEW;
      EXCEPTION
          WHEN OTHERS THEN
              RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
              RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Tentar executar usando query SQL direta
    const { error: functionError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(0); // Query dummy para testar conexão
    
    if (functionError) {
      console.log('❌ Erro de conexão:', functionError.message);
      return;
    }
    
    console.log('✅ Conexão OK. Agora você precisa executar manualmente no Supabase Dashboard:');
    console.log('\n--- COPIE E EXECUTE NO SQL EDITOR DO SUPABASE ---');
    console.log('-- 1. Remover trigger e função existentes');
    console.log('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
    console.log('DROP FUNCTION IF EXISTS public.handle_new_user();');
    console.log('');
    console.log('-- 2. Criar função');
    console.log(createFunctionSQL);
    console.log('');
    console.log('-- 3. Criar trigger');
    console.log('CREATE TRIGGER on_auth_user_created');
    console.log('    AFTER INSERT ON auth.users');
    console.log('    FOR EACH ROW');
    console.log('    EXECUTE FUNCTION public.handle_new_user();');
    console.log('--- FIM DO SCRIPT ---\n');
    
    console.log('📋 INSTRUÇÕES:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá em SQL Editor');
    console.log('3. Copie e cole o script acima');
    console.log('4. Execute o script');
    console.log('5. Execute: node test-auth-trigger-simple.js');
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

createTrigger();