import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Usar service role key se disponível, senão usar anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectSQL() {
  console.log('🔍 Testando execução direta do SQL...');
  
  try {
    // Primeiro, vamos tentar criar a função diretamente
    console.log('\n📝 Criando função handle_new_user...');
    
    const createFunctionSQL = `
      -- Remover função existente se houver
      DROP FUNCTION IF EXISTS public.handle_new_user();
      
      -- Criar função handle_new_user
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Log para debug
          RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
          
          -- Inserir perfil do usuário
          INSERT INTO public.user_profiles (
              id,
              email,
              full_name,
              subscription_type,
              subscription_status,
              trial_ends_at,
              created_at,
              updated_at,
              totp_secret,
              totp_enabled
          ) VALUES (
              NEW.id,
              NEW.email,
              COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
              'free',
              'active',
              NOW() + INTERVAL '7 days',
              NOW(),
              NOW(),
              NULL,
              false
          );
          
          RAISE LOG 'Profile created successfully for user: %', NEW.id;
          
          RETURN NEW;
      EXCEPTION
          WHEN OTHERS THEN
              RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
              RAISE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Executar usando uma query raw se possível
    const { data: funcResult, error: funcError } = await supabase
      .from('_dummy_table_that_does_not_exist')
      .select('*')
      .limit(0);
    
    console.log('\n🔍 Testando conexão com o banco...');
    console.log('URL:', supabaseUrl);
    console.log('Key type:', supabaseKey?.substring(0, 20) + '...');
    
    // Tentar uma operação simples
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro na conexão:', testError);
    } else {
      console.log('✅ Conexão OK');
    }
    
    console.log('\n⚠️  Para resolver o problema, execute o seguinte SQL no Supabase Dashboard:');
    console.log('\n' + createFunctionSQL);
    
    console.log('\n📝 Depois execute este SQL para criar o trigger:');
    console.log(`
      -- Remover trigger existente se houver
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      -- Criar trigger
      CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_new_user();
    `);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testDirectSQL();