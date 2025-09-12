-- Corrigir problema com subscription_status_enum
-- Esta migração resolve o erro "type subscription_status_enum does not exist"

-- 1. Remover trigger problemático temporariamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Remover função problemática
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Verificar se a tabela user_profiles existe, se não, criar
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    subscription_type TEXT DEFAULT 'pending',
    subscription_status TEXT DEFAULT 'pending_email',
    stripe_customer_id TEXT,
    totp_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar enum se não existir
DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM (
        'pending_email',
        'pending_subscription', 
        'active',
        'cancelled',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN 
        -- Se já existe, não fazer nada
        NULL;
END $$;

-- 5. Alterar coluna apenas se ela existir e for do tipo TEXT
DO $$ 
BEGIN
    -- Verificar se a coluna existe e é do tipo text
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'subscription_status' 
        AND data_type = 'text'
    ) THEN
        -- Alterar para enum
        ALTER TABLE public.user_profiles 
        ALTER COLUMN subscription_status TYPE subscription_status_enum 
        USING subscription_status::subscription_status_enum;
        
        -- Definir valor padrão
        ALTER TABLE public.user_profiles 
        ALTER COLUMN subscription_status SET DEFAULT 'pending_email';
    END IF;
END $$;

-- 6. Criar função handle_new_user mais robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Log para debug
    RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
    
    -- Inserir perfil do usuário com tratamento de erro
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
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
            'pending',
            'pending_email'::subscription_status_enum,
            FALSE,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();
        
        RAISE LOG 'Profile created successfully for user: %', NEW.id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
            -- Não falhar o cadastro se houver erro na criação do perfil
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recriar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Habilitar RLS na tabela user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS (com IF NOT EXISTS)
DO $$ BEGIN
    CREATE POLICY "Users can view own profile" ON public.user_profiles
        FOR SELECT USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own profile" ON public.user_profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 10. Comentário explicativo
COMMENT ON TABLE public.user_profiles IS 'Perfis de usuário com estados de autenticação e assinatura';
COMMENT ON COLUMN public.user_profiles.subscription_status IS 'Estado do usuário: pending_email, pending_subscription, active, cancelled, expired';