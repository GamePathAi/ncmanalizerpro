-- Script para desativar RLS temporariamente e testar
-- Execute este script no painel do Supabase (SQL Editor)

-- 1. Desativar RLS completamente
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_profiles';
    END LOOP;
END $$;

-- 3. Conceder permissões totais temporariamente
GRANT ALL ON public.user_profiles TO anon;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.user_profiles TO postgres;

-- 4. Verificar se RLS está desativado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 5. Verificar políticas (deve retornar 0)
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'user_profiles';

SELECT 'RLS desativado temporariamente. Teste o cadastro agora.' as resultado;