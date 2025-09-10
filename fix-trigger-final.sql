-- Script final para corrigir o trigger e função handle_new_user

-- 1. Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Remover função existente se houver
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Criar função simples e funcional
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log para debug
  RAISE LOG 'handle_new_user: Iniciando para usuário %', NEW.id;
  
  -- Inserir perfil do usuário
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    subscription_type,
    subscription_status,
    totp_enabled,
    totp_secret,
    totp_backup_codes
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    'free',
    'active',
    false,
    NULL,
    NULL
  );
  
  RAISE LOG 'handle_new_user: Perfil criado com sucesso para %', NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Erro ao criar perfil para %: %', NEW.email, SQLERRM;
    -- Re-raise o erro para que o cadastro falhe se não conseguir criar o perfil
    RAISE;
END;
$$;

-- 4. Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 5. Criar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Verificações finais
SELECT 'Função criada com sucesso' as status;

-- Verificar se a função existe
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- Verificar se o trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Verificar estrutura da tabela user_profiles
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Setup completo! Agora teste o cadastro.' as final_message;