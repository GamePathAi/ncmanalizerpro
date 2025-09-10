-- Script completo para configurar TOTP do zero
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. CRIAR TABELA USER_PROFILES
-- ================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_type TEXT DEFAULT 'pending',
  subscription_status TEXT DEFAULT 'pending',
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT FALSE,
  totp_backup_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários para documentação
COMMENT ON TABLE public.user_profiles IS 'Perfis de usuários com configurações TOTP';
COMMENT ON COLUMN public.user_profiles.totp_secret IS 'Secret key para TOTP em base32';
COMMENT ON COLUMN public.user_profiles.totp_enabled IS 'Indica se TOTP está ativado';
COMMENT ON COLUMN public.user_profiles.totp_backup_codes IS 'Códigos de backup hasheados';

-- 2. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Criar políticas RLS
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- ==========================================

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

-- 4. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. FUNÇÕES PARA TOTP
-- ===================

-- Função para gerar códigos de backup
CREATE OR REPLACE FUNCTION public.generate_totp_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
    codes TEXT[] := '{}';
    i INTEGER;
    code TEXT;
BEGIN
    -- Gerar 10 códigos de backup de 8 dígitos
    FOR i IN 1..10 LOOP
        code := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
        codes := array_append(codes, code);
    END LOOP;
    
    RETURN codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar código de backup
CREATE OR REPLACE FUNCTION public.validate_backup_code(user_id UUID, backup_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_codes TEXT[];
    updated_codes TEXT[];
    code_found BOOLEAN := FALSE;
    code TEXT;
BEGIN
    -- Buscar códigos do usuário
    SELECT totp_backup_codes INTO user_codes
    FROM public.user_profiles
    WHERE id = user_id AND totp_enabled = TRUE;
    
    IF user_codes IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se o código existe e removê-lo
    FOREACH code IN ARRAY user_codes LOOP
        IF code = backup_code THEN
            code_found := TRUE;
        ELSE
            updated_codes := array_append(updated_codes, code);
        END IF;
    END LOOP;
    
    -- Se código foi encontrado, atualizar a lista
    IF code_found THEN
        UPDATE public.user_profiles
        SET totp_backup_codes = updated_codes,
            updated_at = NOW()
        WHERE id = user_id;
    END IF;
    
    RETURN code_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. AUTH HOOK PERSONALIZADO
-- ==========================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  user_profile RECORD;
  claims jsonb;
BEGIN
  -- Buscar dados do perfil do usuário
  SELECT 
    full_name,
    subscription_type,
    subscription_status,
    totp_enabled
  INTO user_profile
  FROM public.user_profiles
  WHERE id = (event->>'user_id')::uuid;
  
  -- Se perfil não encontrado, retornar evento original
  IF NOT FOUND THEN
    RETURN event;
  END IF;
  
  -- Adicionar claims personalizados
  claims := jsonb_build_object(
    'full_name', user_profile.full_name,
    'subscription_type', user_profile.subscription_type,
    'subscription_status', user_profile.subscription_status,
    'totp_enabled', user_profile.totp_enabled
  );
  
  -- Adicionar claims ao token
  RETURN jsonb_set(
    event,
    '{claims}',
    (COALESCE(event->'claims', '{}'::jsonb) || claims)
  );
END;
$$;

-- Permissões para o auth hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- 7. ÍNDICES PARA PERFORMANCE
-- ===========================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_totp_enabled ON public.user_profiles(totp_enabled) WHERE totp_enabled = TRUE;

-- 8. VERIFICAÇÃO FINAL
-- ====================

SELECT 
    'user_profiles table' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

UNION ALL

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

UNION ALL

SELECT 
    'custom_access_token_hook function' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'custom_access_token_hook'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

ORDER BY object_type;

-- FIM DO SCRIPT
-- =============

-- INSTRUÇÕES:
-- 1. Copie todo este conteúdo
-- 2. Acesse o Supabase Dashboard
-- 3. Vá em SQL Editor
-- 4. Cole e execute este script
-- 5. Verifique se todos os objetos mostram ✅ Created
-- 6. Configure o auth hook no Dashboard (Authentication > Hooks)
-- 7. Teste com: node test-signup-minimal.js