import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente não encontradas!');
    console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql, description) {
    console.log(`🔄 ${description}...`);
    try {
        const { data, error } = await supabase.rpc('exec', { sql });
        if (error) {
            console.error(`❌ Erro em ${description}:`, error.message);
            return false;
        }
        console.log(`✅ ${description} - Sucesso`);
        return true;
    } catch (err) {
        console.error(`❌ Exceção em ${description}:`, err.message);
        return false;
    }
}

async function executeSQLDirect(sql, description) {
    console.log(`🔄 ${description}...`);
    try {
        // Usar query direta para comandos DDL
        const { data, error } = await supabase
            .from('pg_stat_activity')
            .select('*')
            .limit(0);
        
        // Executar via REST API direta
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erro HTTP em ${description}:`, response.status, errorText);
            return false;
        }
        
        console.log(`✅ ${description} - Sucesso`);
        return true;
    } catch (err) {
        console.error(`❌ Exceção em ${description}:`, err.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Executando correção RLS diretamente via API...');
    
    const sqlCommands = [
        {
            sql: 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;',
            description: 'Removendo trigger existente'
        },
        {
            sql: 'DROP FUNCTION IF EXISTS public.handle_new_user();',
            description: 'Removendo função existente'
        },
        {
            sql: `DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
                  DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
                  DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
                  DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON public.user_profiles;
                  DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;`,
            description: 'Removendo políticas RLS conflitantes'
        },
        {
            sql: 'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;',
            description: 'Desabilitando RLS temporariamente'
        },
        {
            sql: `CREATE OR REPLACE FUNCTION public.handle_new_user()
                  RETURNS TRIGGER AS $$
                  BEGIN
                      RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
                      
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
                      
                      RAISE LOG 'Profile created successfully for user: %', NEW.id;
                      
                      RETURN NEW;
                  EXCEPTION
                      WHEN OTHERS THEN
                          RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
                          RETURN NEW;
                  END;
                  $$ LANGUAGE plpgsql SECURITY DEFINER;`,
            description: 'Criando função handle_new_user'
        },
        {
            sql: `CREATE TRIGGER on_auth_user_created
                      AFTER INSERT ON auth.users
                      FOR EACH ROW
                      EXECUTE FUNCTION public.handle_new_user();`,
            description: 'Criando trigger'
        },
        {
            sql: 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;',
            description: 'Reabilitando RLS'
        },
        {
            sql: `CREATE POLICY "Allow trigger to insert profiles" ON public.user_profiles
                      FOR INSERT 
                      WITH CHECK (true);`,
            description: 'Criando política de inserção'
        },
        {
            sql: `CREATE POLICY "Users can view own profile" ON public.user_profiles
                      FOR SELECT 
                      USING (auth.uid() = id);`,
            description: 'Criando política de visualização'
        },
        {
            sql: `CREATE POLICY "Users can update own profile" ON public.user_profiles
                      FOR UPDATE 
                      USING (auth.uid() = id);`,
            description: 'Criando política de atualização'
        },
        {
            sql: `CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
                      FOR ALL 
                      USING (auth.jwt() ->> 'role' = 'service_role');`,
            description: 'Criando política para service role'
        },
        {
            sql: `GRANT ALL ON public.user_profiles TO authenticated;
                  GRANT SELECT, INSERT ON public.user_profiles TO anon;
                  GRANT ALL ON public.user_profiles TO service_role;`,
            description: 'Concedendo permissões'
        }
    ];
    
    let success = true;
    
    for (const command of sqlCommands) {
        const result = await executeSQLDirect(command.sql, command.description);
        if (!result) {
            success = false;
            console.log('⚠️ Continuando mesmo com erro...');
        }
        // Pequena pausa entre comandos
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (success) {
        console.log('\n✅ Correção executada com sucesso!');
        console.log('🧪 Teste agora com: node test-auth-trigger-simple.js');
    } else {
        console.log('\n⚠️ Alguns comandos falharam, mas a correção pode ter funcionado.');
        console.log('🧪 Teste com: node test-auth-trigger-simple.js');
    }
}

main().catch(console.error);