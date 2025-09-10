-- Script para recriar o trigger de forma mais simples e robusta
-- Execute este script no painel do Supabase (SQL Editor)

-- 1. Remover trigger e função existentes completamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Verificar se a tabela user_profiles existe e tem a estrutura correta
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Criar função mais simples e robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log de debug
  RAISE LOG 'Trigger executado para usuário: %', NEW.id;
  
  -- Inserir com valores padrão simples
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    subscription_type,
    subscription_status,
    totp_secret,
    totp_enabled,
    totp_backup_codes
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    'free',
    'active',
    NULL,
    false,
    NULL
  );
  
  RAISE LOG 'Perfil criado com sucesso para usuário: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'ERRO ao criar perfil para usuário %: % - %', NEW.id, SQLSTATE, SQLERRM;
    -- Não falhar o cadastro mesmo se houver erro
    RETURN NEW;
END;
$$;

-- 4. Conceder todas as permissões necessárias
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 5. Criar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Garantir que a tabela tenha as permissões corretas
GRANT ALL ON public.user_profiles TO postgres;
GRANT ALL ON public.user_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT INSERT ON public.user_profiles TO anon;

-- 7. Verificações finais
SELECT 
  'Função criada' as status,
  proname as function_name
FROM pg_proc 
WHERE proname = 'handle_new_user';

SELECT 
  'Trigger criado' as status,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 8. Testar a função manualmente (simulando um usuário)
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_email text := 'test-trigger-' || extract(epoch from now()) || '@example.com';
BEGIN
  RAISE LOG 'Testando função com usuário: % e email: %', test_user_id, test_email;
  
  -- Simular inserção na tabela user_profiles
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    subscription_type,
    subscription_status,
    totp_secret,
    totp_enabled,
    totp_backup_codes
  )
  VALUES (
    test_user_id,
    test_email,
    'Teste Manual',
    'free',
    'active',
    NULL,
    false,
    NULL
  );
  
  RAISE LOG 'Teste manual da inserção funcionou!';
  
  -- Limpar teste
  DELETE FROM public.user_profiles WHERE id = test_user_id;
  
  RAISE LOG 'Teste limpo com sucesso';
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'ERRO no teste manual: % - %', SQLSTATE, SQLERRM;
END;
$$;

SELECT 'Trigger recriado com sucesso! Teste o cadastro agora.' as resultado;