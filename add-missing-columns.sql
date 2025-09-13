-- Adicionar colunas que estão faltando na tabela user_profiles
-- Este script será executado no banco remoto via Supabase CLI

-- 1. Adicionar coluna email_verified_at se não existir
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 2. Adicionar coluna stripe_customer_id se não existir  
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 3. Verificar se a coluna subscription_status existe e tem o tipo correto
-- Se não existir, criar com o tipo correto
DO $$ 
BEGIN
    -- Tentar adicionar a coluna subscription_status
    BEGIN
        ALTER TABLE public.user_profiles 
        ADD COLUMN subscription_status TEXT DEFAULT 'pending_email' 
        CHECK (subscription_status IN ('pending_email', 'pending_subscription', 'active'));
    EXCEPTION
        WHEN duplicate_column THEN
            -- Se a coluna já existe, apenas adicionar a constraint se não existir
            BEGIN
                ALTER TABLE public.user_profiles 
                ADD CONSTRAINT user_profiles_subscription_status_check 
                CHECK (subscription_status IN ('pending_email', 'pending_subscription', 'active'));
            EXCEPTION
                WHEN duplicate_object THEN
                    -- Constraint já existe, tudo ok
                    NULL;
            END;
    END;
END $$;

-- 4. Criar índices para performance se não existirem
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status 
ON public.user_profiles(subscription_status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id 
ON public.user_profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified_at 
ON public.user_profiles(email_verified_at);

-- 5. Atualizar função handle_new_user para usar os novos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, email_verified_at, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.email_confirmed_at,
    CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'pending_subscription'
      ELSE 'pending_email'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified_at = EXCLUDED.email_verified_at,
    subscription_status = EXCLUDED.subscription_status,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para atualizar status quando email é confirmado
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o email foi confirmado (email_confirmed_at mudou de NULL para uma data)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.user_profiles 
    SET 
      email_verified_at = NEW.email_confirmed_at,
      subscription_status = 'pending_subscription',
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger para confirmação de email se não existir
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_confirmation();

-- 8. Verificar estrutura final
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;