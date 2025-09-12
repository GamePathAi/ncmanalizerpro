-- Script para adicionar estados de usuário ao sistema de autenticação
-- Estados: pending_email, pending_subscription, active

-- Adicionar campos necessários à tabela user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_state TEXT CHECK (user_state IN ('pending_email', 'pending_subscription', 'active')) DEFAULT 'pending_email',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_state ON user_profiles(user_state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON user_profiles(email_verified_at);

-- Função para atualizar estado do usuário baseado na verificação de email e assinatura
CREATE OR REPLACE FUNCTION update_user_state()
RETURNS TRIGGER AS $$
BEGIN
    -- Se email não foi verificado, estado é pending_email
    IF NEW.email_verified_at IS NULL THEN
        NEW.user_state = 'pending_email';
    -- Se email foi verificado mas não tem assinatura ativa, estado é pending_subscription
    ELSIF NEW.subscription_status != 'active' OR NEW.subscription_status IS NULL THEN
        NEW.user_state = 'pending_subscription';
    -- Se email foi verificado e tem assinatura ativa, estado é active
    ELSE
        NEW.user_state = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estado automaticamente
DROP TRIGGER IF EXISTS update_user_state_trigger ON user_profiles;
CREATE TRIGGER update_user_state_trigger
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_state();

-- Função para sincronizar verificação de email do auth.users
CREATE OR REPLACE FUNCTION sync_email_verification()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar email_verified_at baseado no email_confirmed_at do auth.users
    UPDATE user_profiles 
    SET email_verified_at = NEW.email_confirmed_at
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar verificação de email
DROP TRIGGER IF EXISTS sync_email_verification_trigger ON auth.users;
CREATE TRIGGER sync_email_verification_trigger
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
    EXECUTE FUNCTION sync_email_verification();

-- Atualizar função handle_new_user para definir estado inicial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        email, 
        full_name, 
        email_verified_at,
        user_state
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        NEW.email_confirmed_at,
        CASE 
            WHEN NEW.email_confirmed_at IS NOT NULL THEN 'pending_subscription'
            ELSE 'pending_email'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para webhook do Stripe atualizar estado para 'active'
CREATE OR REPLACE FUNCTION handle_stripe_subscription_update(
    p_customer_id TEXT,
    p_subscription_id TEXT,
    p_status TEXT,
    p_plan_type TEXT DEFAULT 'annual'
)
RETURNS VOID AS $$
BEGIN
    -- Atualizar user_profiles
    UPDATE user_profiles 
    SET 
        stripe_customer_id = p_customer_id,
        subscription_id = p_subscription_id,
        subscription_status = CASE 
            WHEN p_status IN ('active', 'trialing') THEN 'active'
            WHEN p_status IN ('canceled', 'incomplete_expired') THEN 'canceled'
            ELSE 'pending'
        END,
        subscription_type = p_plan_type,
        subscription_start_date = CASE 
            WHEN p_status IN ('active', 'trialing') THEN NOW()
            ELSE subscription_start_date
        END,
        updated_at = NOW()
    WHERE stripe_customer_id = p_customer_id OR customer_id = p_customer_id;
    
    -- Inserir ou atualizar na tabela subscriptions
    INSERT INTO subscriptions (
        user_id,
        stripe_subscription_id,
        stripe_customer_id,
        status,
        plan_type,
        current_period_start
    )
    SELECT 
        up.id,
        p_subscription_id,
        p_customer_id,
        CASE 
            WHEN p_status IN ('active', 'trialing') THEN 'active'
            WHEN p_status = 'canceled' THEN 'canceled'
            WHEN p_status = 'past_due' THEN 'past_due'
            ELSE 'unpaid'
        END,
        p_plan_type,
        NOW()
    FROM user_profiles up
    WHERE up.stripe_customer_id = p_customer_id OR up.customer_id = p_customer_id
    ON CONFLICT (stripe_subscription_id) 
    DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON COLUMN user_profiles.email_verified_at IS 'Timestamp de quando o email foi verificado';
COMMENT ON COLUMN user_profiles.user_state IS 'Estado atual do usuário: pending_email, pending_subscription, active';
COMMENT ON COLUMN user_profiles.stripe_customer_id IS 'ID do cliente no Stripe';
COMMENT ON FUNCTION update_user_state() IS 'Atualiza automaticamente o estado do usuário baseado na verificação de email e assinatura';
COMMENT ON FUNCTION handle_stripe_subscription_update(TEXT, TEXT, TEXT, TEXT) IS 'Função para webhook do Stripe atualizar assinatura e estado do usuário';

-- Atualizar usuários existentes para ter o estado correto
UPDATE user_profiles 
SET 
    email_verified_at = (
        SELECT email_confirmed_at 
        FROM auth.users 
        WHERE auth.users.id = user_profiles.id
    ),
    user_state = CASE 
        WHEN (
            SELECT email_confirmed_at 
            FROM auth.users 
            WHERE auth.users.id = user_profiles.id
        ) IS NULL THEN 'pending_email'
        WHEN subscription_status = 'active' THEN 'active'
        ELSE 'pending_subscription'
    END
WHERE user_state IS NULL OR user_state != CASE 
    WHEN (
        SELECT email_confirmed_at 
        FROM auth.users 
        WHERE auth.users.id = user_profiles.id
    ) IS NULL THEN 'pending_email'
    WHEN subscription_status = 'active' THEN 'active'
    ELSE 'pending_subscription'
END;

SELECT 'Estados de usuário implementados com sucesso!' as result;