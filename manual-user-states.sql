-- Estados de usuário - Execução manual
-- Execute este SQL no dashboard do Supabase

-- Adicionar campos necessários
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_state TEXT CHECK (user_state IN ('pending_email', 'pending_subscription', 'active')) DEFAULT 'pending_email';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_state ON user_profiles(user_state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON user_profiles(email_verified_at);

-- Função para atualizar estado do usuário
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

-- Atualizar usuários existentes
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
    END;

SELECT 'Estados de usuário implementados!' as result;