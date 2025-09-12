import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente não encontradas!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeRawSQL(sql, description) {
    console.log(`🔄 ${description}...`);
    try {
        // Usar a API REST direta do PostgREST para executar SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                query: sql
            })
        });
        
        if (response.ok || response.status === 201) {
            console.log(`✅ ${description} - Sucesso`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`❌ Erro em ${description}:`, response.status, errorText);
            return false;
        }
    } catch (err) {
        console.error(`❌ Exceção em ${description}:`, err.message);
        return false;
    }
}

async function checkTriggerStatus() {
    console.log('\n🔍 Verificando status atual...');
    
    try {
        // Verificar função
        const { data: functions, error: funcError } = await supabase
            .from('information_schema.routines')
            .select('routine_name')
            .eq('routine_name', 'handle_new_user');
            
        console.log('📋 Função handle_new_user:', functions?.length > 0 ? '✅ EXISTE' : '❌ NÃO EXISTE');
        
        // Verificar trigger
        const { data: triggers, error: trigError } = await supabase
            .from('information_schema.triggers')
            .select('trigger_name')
            .eq('trigger_name', 'on_auth_user_created');
            
        console.log('🔧 Trigger on_auth_user_created:', triggers?.length > 0 ? '✅ EXISTE' : '❌ NÃO EXISTE');
        
        // Verificar políticas RLS
        const { data: policies, error: polError } = await supabase
            .from('pg_policies')
            .select('policyname')
            .eq('tablename', 'user_profiles');
            
        console.log('🔒 Políticas RLS na user_profiles:', policies?.length || 0);
        
        // Verificar RLS habilitado
        const { data: tables, error: tableError } = await supabase
            .from('pg_tables')
            .select('rowsecurity')
            .eq('tablename', 'user_profiles');
            
        console.log('🛡️ RLS habilitado:', tables?.[0]?.rowsecurity ? '✅ SIM' : '❌ NÃO');
        
    } catch (err) {
        console.error('❌ Erro ao verificar status:', err.message);
    }
}

async function main() {
    console.log('🚀 Executando correção RLS via Supabase...');
    console.log('\n⚠️ IMPORTANTE: Execute o script EXECUTE_RLS_FIX.sql manualmente no Supabase Dashboard!');
    console.log('📋 Passos:');
    console.log('1. Abra o Supabase Dashboard');
    console.log('2. Vá em SQL Editor');
    console.log('3. Cole o conteúdo do arquivo EXECUTE_RLS_FIX.sql');
    console.log('4. Execute o script');
    console.log('\n🔍 Verificando status atual antes da correção...');
    
    await checkTriggerStatus();
    
    console.log('\n📝 Conteúdo do script para executar:');
    console.log('=' .repeat(60));
    
    const sqlScript = `
-- EXECUTE ESTE SCRIPT NO SUPABASE DASHBOARD SQL EDITOR

-- 1. Remover objetos existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Remover políticas RLS
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;

-- 3. Desabilitar RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Criar função
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Reabilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS
CREATE POLICY "Allow trigger to insert profiles" ON public.user_profiles
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- 8. Conceder permissões
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT ON public.user_profiles TO anon;
GRANT ALL ON public.user_profiles TO service_role;

-- 9. Verificações
SELECT 'Trigger criado:' as status, COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 'Função criada:' as status, COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

SELECT 'Políticas RLS:' as status, COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'user_profiles';

SELECT 'RLS habilitado:' as status, rowsecurity as enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

SELECT '✅ CORREÇÃO COMPLETA! Teste com: node test-auth-trigger-simple.js' as resultado;
`;
    
    console.log(sqlScript);
    console.log('=' .repeat(60));
    
    console.log('\n🎯 Após executar o script no Dashboard, teste com:');
    console.log('   node test-auth-trigger-simple.js');
}

main().catch(console.error);