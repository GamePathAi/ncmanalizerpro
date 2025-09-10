-- Script para diagnosticar e corrigir a função handle_new_user
-- Execute este script no painel SQL do Supabase

-- 1. Verificar se a função existe
SELECT 
    routine_name,
    routine_type,
    routine_schema,
    specific_name
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 2. Verificar triggers existentes
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%user%';

-- 3. Remover completamente qualquer vestígio anterior
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 4. Criar a função com sintaxe mais explícita
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log de debug
    RAISE LOG 'Trigger handle_new_user executado para usuário: %', NEW.id;
    
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
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'free',
        'active',
        false,
        NOW(),
        NOW()
    );
    
    RAISE LOG 'Perfil criado com sucesso para usuário: %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Erro no trigger handle_new_user: % %', SQLERRM, SQLSTATE;
        RETURN NEW; -- Não falhar o cadastro por causa do trigger
END;
$$;

-- 5. Garantir permissões corretas
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 6. Recriar o trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. Verificar se foi criado corretamente
SELECT 
    routine_name,
    routine_type,
    routine_schema,
    specific_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 8. Verificar o trigger
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 9. Testar a função diretamente (simulação)
-- Esta parte é só para verificar se a função existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

SELECT 'Função handle_new_user configurada com sucesso!' as status;