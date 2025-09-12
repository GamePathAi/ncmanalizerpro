-- =====================================================
-- CORREÇÃO DEFINITIVA DO TRIGGER E POLÍTICAS RLS
-- Execute este script COMPLETO no Supabase Dashboard
-- =====================================================

-- 1. REMOVER TRIGGER E FUNÇÃO EXISTENTES
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. REMOVER TODAS AS POLÍTICAS RLS CONFLITANTES
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;

-- 3. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. CRIAR FUNÇÃO HANDLE_NEW_USER COM PERMISSÕES CORRETAS
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
        -- Não falhar o cadastro se houver erro na criação do perfil
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CRIAR TRIGGER
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. REABILITAR RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICAS RLS CORRETAS
-- Política para permitir inserção via trigger (sem restrições)
CREATE POLICY "Allow trigger to insert profiles" ON public.user_profiles
    FOR INSERT 
    WITH CHECK (true);

-- Política para usuários visualizarem seus próprios perfis
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Política para usuários atualizarem seus próprios perfis
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- Política para service role gerenciar todos os perfis
CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- 8. CONCEDER PERMISSÕES NECESSÁRIAS
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT ON public.user_profiles TO anon;
GRANT ALL ON public.user_profiles TO service_role;

-- 9. VERIFICAÇÕES FINAIS
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

-- 10. RESULTADO
SELECT '✅ CORREÇÃO COMPLETA! Teste o cadastro agora com: node test-auth-trigger-simple.js' as resultado;

-- =====================================================
-- INSTRUÇÕES:
-- 1. Copie TODO este script
-- 2. Cole no SQL Editor do Supabase Dashboard
-- 3. Execute
-- 4. Teste com: node test-auth-trigger-simple.js
-- =====================================================