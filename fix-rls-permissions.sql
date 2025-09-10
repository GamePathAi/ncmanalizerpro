-- Script para corrigir permissões e RLS na tabela user_profiles
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 2. Desabilitar RLS temporariamente para teste
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Conceder permissões necessárias
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO anon;
GRANT ALL ON public.user_profiles TO service_role;

-- 4. Verificar permissões atuais
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'user_profiles';

-- 5. Recriar função com permissões corretas
DROP FUNCTION IF EXISTS public.handle_new_user();

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
        -- Não falhar o cadastro se houver erro na criação do perfil
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. Verificar se tudo foi criado
SELECT 
    'RLS Status' as check_type,
    CASE WHEN rowsecurity THEN '🔒 Enabled' ELSE '🔓 Disabled' END as status
FROM pg_tables 
WHERE tablename = 'user_profiles'

UNION ALL

SELECT 
    'Function' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

UNION ALL

SELECT 
    'Trigger' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status;

-- 8. Teste de inserção manual (opcional)
-- INSERT INTO public.user_profiles (id, email, full_name, subscription_type, subscription_status, created_at, updated_at, totp_enabled)
-- VALUES ('test-user-id', 'test@example.com', 'Test User', 'free', 'active', NOW(), NOW(), false);

-- INSTRUÇÕES:
-- 1. Execute este script no Supabase Dashboard
-- 2. Verifique se todos os checks mostram ✅ ou 🔓
-- 3. Teste com: node test-signup.js
-- 4. Se funcionar, você pode reabilitar RLS depois:
--    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;