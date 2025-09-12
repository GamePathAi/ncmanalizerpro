-- Criar enum para subscription_status
DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM (
        'pending_email',
        'pending_subscription', 
        'active',
        'cancelled',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alterar coluna subscription_status para usar o enum
ALTER TABLE public.user_profiles 
ALTER COLUMN subscription_status TYPE subscription_status_enum 
USING subscription_status::subscription_status_enum;

-- Definir valor padrão
ALTER TABLE public.user_profiles 
ALTER COLUMN subscription_status SET DEFAULT 'pending_email';

-- Atualizar função handle_new_user para usar o enum
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
        'pending_email'::subscription_status_enum,
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