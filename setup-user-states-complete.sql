-- Setup completo do sistema de estados de usuário
-- Este script implementa o modelo de usuário com todos os campos necessários

-- 1. Criar enum para subscription_status
CREATE TYPE subscription_status_enum AS ENUM (
  'pending_email',
  'pending_subscription', 
  'active'
);

-- 2. Criar tabela user_profiles com todos os campos necessários
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  subscription_status subscription_status_enum DEFAULT 'pending_email' NOT NULL,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON public.user_profiles(stripe_customer_id);

-- 4. Configurar RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role pode fazer tudo (para webhooks)
CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para updated_at
CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. Função para criar perfil automaticamente quando usuário se registra
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 10. Função para atualizar status quando email é confirmado
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

-- 11. Trigger para confirmação de email
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_confirmation();

-- 12. Função para obter estado do usuário (helper function)
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

-- 13. Função para atualizar status de assinatura (para webhooks do Stripe)
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

-- 14. Grants necessários
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT USAGE ON TYPE subscription_status_enum TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_state(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_subscription_status(TEXT, subscription_status_enum, TEXT) TO service_role;

COMMIT;