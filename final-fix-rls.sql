-- Script final para corrigir RLS e trigger
-- Execute este script no painel do Supabase (SQL Editor)

-- 1. Desativar RLS temporariamente
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable all for service role" ON public.user_profiles;

-- 3. Remover constraint de chave estrangeira se existir
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- 4. Remover trigger e função existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Criar nova função com permissões corretas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free',
    'active',
    NULL,
    false,
    NULL,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. Conceder permissões à função
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 7. Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Reativar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas mais permissivas
CREATE POLICY "Enable all for authenticated users" ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all for service role" ON public.user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable insert for anon" ON public.user_profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 10. Conceder permissões na tabela
GRANT ALL ON public.user_profiles TO postgres;
GRANT ALL ON public.user_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT INSERT ON public.user_profiles TO anon;

-- 11. Verificação final
SELECT 
  'Trigger criado' as status,
  COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 
  'Função criada' as status,
  COUNT(*) as function_count
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

SELECT 
  'Políticas criadas' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Mensagem de sucesso
SELECT 'Script executado com sucesso! Teste o cadastro agora.' as resultado;