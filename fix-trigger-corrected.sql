-- Script SQL corrigido para executar no Supabase SQL Editor
-- Remove políticas existentes antes de recriar

-- 1. Remover constraint de chave estrangeira problemática
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- 2. Desativar RLS temporariamente para debug
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Conceder permissões necessárias
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;
GRANT ALL ON user_profiles TO service_role;

-- 4. Remover trigger e função existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Criar nova função com tratamento de exceções
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Log de debug
  RAISE LOG 'Trigger executado para usuário: %', NEW.id;
  
  -- Verificar se o perfil já existe
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    RAISE LOG 'Perfil já existe para usuário: %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Inserir novo perfil
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
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
      'free',
      'active',
      NULL,
      false,
      NULL,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Perfil criado com sucesso para usuário: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    -- Não falhar o cadastro por causa do perfil
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Reativar RLS com políticas corretas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 8. Remover políticas existentes antes de recriar
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;

-- 9. Criar novas políticas
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Verificação final
SELECT 'Script executado com sucesso!' as status;