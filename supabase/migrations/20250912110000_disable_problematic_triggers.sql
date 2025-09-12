-- Migração para desabilitar temporariamente os triggers problemáticos
-- Isso permitirá que o cadastro funcione enquanto investigamos o problema

-- 1. Remover os triggers problemáticos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- 2. Comentário explicativo
COMMENT ON TABLE public.user_profiles IS 'Triggers temporariamente removidos para permitir cadastro básico. Os perfis serão criados via aplicação.';

-- 3. Criar uma função simples para criar perfil manualmente (se necessário)
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT DEFAULT 'Usuário'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
        user_id,
        user_email,
        user_full_name,
        'pending',
        'pending_email'::subscription_status_enum,
        FALSE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
END;
$$;

-- 4. Comentário sobre a função
COMMENT ON FUNCTION public.create_user_profile IS 'Função para criar perfil de usuário manualmente quando necessário';