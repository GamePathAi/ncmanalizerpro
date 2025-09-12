-- Adicionar campos necessários para sistema de estados de usuário
-- Esta migração complementa a tabela user_profiles existente

-- 1. Criar enum para subscription_status se não existir
DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM (
        'pending_email',
        'pending_subscription', 
        'active'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar campos que faltam na tabela user_profiles
ALTER TABLE public.user_profiles 
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 3. Alterar o tipo da coluna subscription_status se necessário
-- Primeiro, adicionar uma coluna temporária com o novo tipo
ALTER TABLE public.user_profiles 
    ADD COLUMN IF NOT EXISTS subscription_status_new subscription_status_enum;

-- 4. Migrar dados existentes para o novo formato
UPDATE public.user_profiles 
SET subscription_status_new = CASE 
    WHEN subscription_status = 'active' THEN 'active'::subscription_status_enum
    WHEN subscription_status = 'pending' THEN 'pending_subscription'::subscription_status_enum
    ELSE 'pending_email'::subscription_status_enum
END
WHERE subscription_status_new IS NULL;

-- 5. Remover a coluna antiga e renomear a nova
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE public.user_profiles RENAME COLUMN subscription_status_new TO subscription_status;

-- 6. Definir valor padrão para a nova coluna
ALTER TABLE public.user_profiles 
    ALTER COLUMN subscription_status SET DEFAULT 'pending_email'::subscription_status_enum,
    ALTER COLUMN subscription_status SET NOT NULL;

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON public.user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified_at ON public.user_profiles(email_verified_at);

-- 8. Atualizar função handle_new_user para usar novos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, email_verified_at, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.email_confirmed_at,
    CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'pending_subscription'::subscription_status_enum
      ELSE 'pending_email'::subscription_status_enum
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified_at = EXCLUDED.email_verified_at,
    subscription_status = EXCLUDED.subscription_status;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Função para atualizar status quando email é confirmado
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o email foi confirmado (email_confirmed_at mudou de NULL para uma data)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.user_profiles 
    SET 
      email_verified_at = NEW.email_confirmed_at,
      subscription_status = 'pending_subscription'::subscription_status_enum
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Criar trigger para confirmação de email se não existir
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_confirmation();

-- 11. Função para obter estado do usuário
CREATE OR REPLACE FUNCTION public.get_user_state(user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  email_verified_at TIMESTAMPTZ,
  subscription_status subscription_status_enum,
  stripe_customer_id TEXT,
  can_access_dashboard BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.email_verified_at,
    up.subscription_status,
    up.stripe_customer_id,
    (up.subscription_status = 'active'::subscription_status_enum) as can_access_dashboard
  FROM public.user_profiles up
  WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Função para atualizar status de assinatura (para webhooks do Stripe)
CREATE OR REPLACE FUNCTION public.update_subscription_status(
  user_email TEXT,
  new_status subscription_status_enum,
  customer_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE public.user_profiles 
  SET 
    subscription_status = new_status,
    stripe_customer_id = COALESCE(customer_id, stripe_customer_id)
  WHERE email = user_email;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Grants necessários
GRANT USAGE ON TYPE subscription_status_enum TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_state(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_subscription_status(TEXT, subscription_status_enum, TEXT) TO service_role;