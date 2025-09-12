-- Migração completa para sistema de autenticação com estados de usuário
-- Resolve o problema circular: usuário precisa estar logado para assinar, mas precisa de assinatura para acessar

-- 1. Adicionar campos necessários na tabela user_profiles se não existirem
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verification_token 
ON public.user_profiles(email_verification_token) 
WHERE email_verification_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_password_reset_token 
ON public.user_profiles(password_reset_token) 
WHERE password_reset_token IS NOT NULL;

-- 3. Função para gerar tokens seguros
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token TEXT;
BEGIN
    -- Gerar token de 32 bytes em hexadecimal (64 caracteres)
    SELECT encode(gen_random_bytes(32), 'hex') INTO token;
    RETURN token;
END;
$$;

-- 4. Função para criar perfil de usuário com token de verificação
CREATE OR REPLACE FUNCTION public.create_user_profile_with_verification(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT DEFAULT 'Usuário'
)
RETURNS TEXT -- Retorna o token de verificação
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    verification_token TEXT;
BEGIN
    -- Gerar token de verificação
    verification_token := public.generate_secure_token();
    
    -- Inserir ou atualizar perfil
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        subscription_type,
        subscription_status,
        totp_enabled,
        email_verification_token,
        email_verification_expires_at,
        created_at,
        updated_at
    )
    VALUES (
        user_id,
        user_email,
        user_full_name,
        'pending',
        'pending_email'::subscription_status_enum,
        FALSE,
        verification_token,
        NOW() + INTERVAL '24 hours', -- Token expira em 24 horas
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verification_token = EXCLUDED.email_verification_token,
        email_verification_expires_at = EXCLUDED.email_verification_expires_at,
        updated_at = NOW();
    
    RETURN verification_token;
END;
$$;

-- 5. Função para verificar email
CREATE OR REPLACE FUNCTION public.verify_user_email(
    token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Buscar usuário pelo token
    SELECT * INTO user_record
    FROM public.user_profiles
    WHERE email_verification_token = token
    AND email_verification_expires_at > NOW();
    
    -- Se não encontrou ou token expirado
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar usuário como verificado
    UPDATE public.user_profiles
    SET 
        email_verified_at = NOW(),
        subscription_status = 'pending_subscription'::subscription_status_enum,
        email_verification_token = NULL,
        email_verification_expires_at = NULL,
        updated_at = NOW()
    WHERE id = user_record.id;
    
    -- Atualizar também na tabela auth.users
    UPDATE auth.users
    SET 
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = user_record.id;
    
    RETURN TRUE;
END;
$$;

-- 6. Função para gerar token de reset de senha
CREATE OR REPLACE FUNCTION public.generate_password_reset_token(
    user_email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reset_token TEXT;
    user_exists BOOLEAN;
BEGIN
    -- Verificar se usuário existe
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles WHERE email = user_email
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN NULL;
    END IF;
    
    -- Gerar token
    reset_token := public.generate_secure_token();
    
    -- Atualizar usuário com token
    UPDATE public.user_profiles
    SET 
        password_reset_token = reset_token,
        password_reset_expires_at = NOW() + INTERVAL '1 hour',
        updated_at = NOW()
    WHERE email = user_email;
    
    RETURN reset_token;
END;
$$;

-- 7. Remover função existente e criar nova para atualizar status de assinatura
DROP FUNCTION IF EXISTS public.update_subscription_status;

CREATE FUNCTION public.update_subscription_status(
    user_id UUID,
    new_status subscription_status_enum,
    stripe_customer_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        subscription_status = new_status,
        stripe_customer_id = COALESCE(stripe_customer_id, user_profiles.stripe_customer_id),
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$;

-- 8. Trigger para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    verification_token TEXT;
BEGIN
    -- Criar perfil com token de verificação
    verification_token := public.create_user_profile_with_verification(
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
    );
    
    -- Log para debug
    RAISE LOG 'User profile created with verification token for user: %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        -- Não falhar o cadastro se houver erro na criação do perfil
        RETURN NEW;
END;
$$;

-- 9. Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- 10. Comentários explicativos
COMMENT ON FUNCTION public.create_user_profile_with_verification IS 'Cria perfil de usuário com token de verificação de email';
COMMENT ON FUNCTION public.verify_user_email IS 'Verifica email do usuário usando token e muda status para pending_subscription';
COMMENT ON FUNCTION public.generate_password_reset_token IS 'Gera token seguro para reset de senha';
COMMENT ON FUNCTION public.update_subscription_status IS 'Atualiza status de assinatura (usado pelo webhook do Stripe)';
COMMENT ON FUNCTION public.handle_new_user_signup IS 'Trigger function para criar perfil automaticamente no cadastro';

-- 11. Políticas RLS para as novas funções
GRANT EXECUTE ON FUNCTION public.verify_user_email TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_password_reset_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_subscription_status TO service_role;
GRANT EXECUTE ON FUNCTION public.create_user_profile_with_verification TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_secure_token TO service_role;