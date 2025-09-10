-- Script para criar apenas a função handle_new_user e o trigger
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Remover trigger e função existentes (se houver)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Criar função handle_new_user
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
        'pending',
        'pending',
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

-- 3. Criar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar se foram criados
SELECT 
    'handle_new_user function' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

UNION ALL

SELECT 
    'on_auth_user_created trigger' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

ORDER BY object_type;

-- Fim do script
-- 
-- INSTRUÇÕES:
-- 1. Copie este conteúdo
-- 2. Acesse o Supabase Dashboard
-- 3. Vá em SQL Editor
-- 4. Cole e execute este script
-- 5. Verifique se ambos mostram ✅ Created
-- 6. Teste com: node test-signup.js