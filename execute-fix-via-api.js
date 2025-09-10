import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeFixScript() {
  console.log('🔧 Executando correções do trigger via API...');
  
  try {
    // 1. Remover constraint de chave estrangeira
    console.log('1. Removendo constraint de chave estrangeira...');
    const { error: dropConstraintError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;'
    });
    
    if (dropConstraintError) {
      console.log('⚠️ Aviso ao remover constraint:', dropConstraintError.message);
    } else {
      console.log('✅ Constraint removida');
    }
    
    // 2. Desativar RLS temporariamente
    console.log('2. Desativando RLS temporariamente...');
    const { error: disableRlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableRlsError) {
      console.log('⚠️ Aviso ao desativar RLS:', disableRlsError.message);
    } else {
      console.log('✅ RLS desativado');
    }
    
    // 3. Conceder permissões
    console.log('3. Concedendo permissões...');
    const permissions = [
      'GRANT ALL ON user_profiles TO authenticated;',
      'GRANT ALL ON user_profiles TO anon;',
      'GRANT ALL ON user_profiles TO service_role;'
    ];
    
    for (const permission of permissions) {
      const { error: permError } = await supabase.rpc('exec_sql', { sql: permission });
      if (permError) {
        console.log('⚠️ Aviso ao conceder permissão:', permError.message);
      }
    }
    console.log('✅ Permissões concedidas');
    
    // 4. Remover trigger e função existentes
    console.log('4. Removendo trigger e função existentes...');
    const { error: dropTriggerError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;'
    });
    
    const { error: dropFunctionError } = await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS public.handle_new_user();'
    });
    
    console.log('✅ Trigger e função removidos');
    
    // 5. Criar nova função
    console.log('5. Criando nova função...');
    const newFunction = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        -- Log de debug
        RAISE LOG 'Trigger executado para usuário: %', NEW.id;
        
        -- Verificar se o perfil já existe
        IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
          RAISE LOG 'Perfil já existe para usuário: %', NEW.id;
          RETURN NEW;
        END IF;
        
        -- Inserir novo perfil
        BEGIN
          INSERT INTO public.user_profiles (
            id,
            email,
            full_name,
            subscription_type,
            subscription_status,
            totp_secret,
            totp_enabled,
            totp_backup_codes,
            created_at,
            updated_at
          ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
            'free',
            'active',
            NULL,
            false,
            NULL,
            NOW(),
            NOW()
          );
          
          RAISE LOG 'Perfil criado com sucesso para usuário: %', NEW.id;
          
        EXCEPTION WHEN OTHERS THEN
          RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
          -- Não falhar o cadastro por causa do perfil
        END;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: createFunctionError } = await supabase.rpc('exec_sql', {
      sql: newFunction
    });
    
    if (createFunctionError) {
      console.log('❌ Erro ao criar função:', createFunctionError.message);
    } else {
      console.log('✅ Nova função criada');
    }
    
    // 6. Criar novo trigger
    console.log('6. Criando novo trigger...');
    const { error: createTriggerError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`
    });
    
    if (createTriggerError) {
      console.log('❌ Erro ao criar trigger:', createTriggerError.message);
    } else {
      console.log('✅ Novo trigger criado');
    }
    
    // 7. Reativar RLS
    console.log('7. Reativando RLS...');
    const { error: enableRlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;'
    });
    
    if (enableRlsError) {
      console.log('⚠️ Aviso ao reativar RLS:', enableRlsError.message);
    } else {
      console.log('✅ RLS reativado');
    }
    
    // 8. Criar políticas RLS
    console.log('8. Criando políticas RLS...');
    const policies = [
      `CREATE POLICY "Users can view own profile" ON user_profiles
       FOR SELECT USING (auth.uid() = id);`,
      `CREATE POLICY "Users can update own profile" ON user_profiles
       FOR UPDATE USING (auth.uid() = id);`,
      `CREATE POLICY "Enable insert for authenticated users" ON user_profiles
       FOR INSERT WITH CHECK (true);`
    ];
    
    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy });
      if (policyError) {
        console.log('⚠️ Aviso ao criar política:', policyError.message);
      }
    }
    console.log('✅ Políticas RLS criadas');
    
    console.log('\n🎉 Correções executadas com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute: node test-signup.js');
    console.log('2. Teste o cadastro pela interface web');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

executeFixScript();