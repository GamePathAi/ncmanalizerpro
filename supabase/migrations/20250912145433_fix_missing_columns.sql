-- Adicionar colunas que estão faltando na tabela user_profiles
-- Baseado na migração mais recente, algumas colunas foram removidas

-- 1. Adicionar email_verified_at (foi removida na migração)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 2. Adicionar stripe_customer_id (foi removida e substituída por customer_id)
-- Vamos usar customer_id como alias para stripe_customer_id
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 3. Remover função e trigger desnecessários (customer_id não existe)
-- Apenas manter stripe_customer_id

-- 4. Não criar triggers para campos inexistentes

-- 5. Não sincronizar dados com coluna inexistente

-- 6. Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified_at 
ON public.user_profiles(email_verified_at);

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id 
ON public.user_profiles(stripe_customer_id);

-- 7. Atualizar função handle_new_user para usar os novos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    email_verified_at, 
    subscription_status
  )
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

-- 8. Recriar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Função para atualizar status quando email é confirmado
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

-- 10. Criar trigger para confirmação de email
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_confirmation();

-- 11. Verificar estrutura final
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
  AND column_name IN ('email_verified_at', 'stripe_customer_id', 'customer_id', 'subscription_status')
ORDER BY column_name;