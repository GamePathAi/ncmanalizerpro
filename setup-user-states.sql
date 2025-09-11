-- Script para implementar sistema de estados de usuário
-- Adiciona campos necessários para controlar os estados: pending_email, pending_subscription, active

-- 1. Criar enum para subscription_status
CREATE TYPE subscription_status_enum AS ENUM (
  'pending_email',
  'pending_subscription', 
  'active'
);

-- 2. Adicionar campos à tabela auth.users (via metadata)
-- Como não podemos modificar auth.users diretamente, vamos criar uma tabela user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  subscription_status subscription_status_enum DEFAULT 'pending_email',
  email_verified_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON public.user_profiles(stripe_customer_id);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS
-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Permitir inserção durante signup
CREATE POLICY "Enable insert for authenticated users" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para updated_at
CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. Criar função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, subscription_status)
  VALUES (NEW.id, NEW.email, 'pending_email');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 10. Criar função para atualizar status após confirmação de email
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se email foi confirmado (email_confirmed_at não era null e agora é)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.user_profiles 
    SET 
      email_verified_at = NEW.email_confirmed_at,
      subscription_status = 'pending_subscription'
    WHERE id = NEW.id AND subscription_status = 'pending_email';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Criar trigger para confirmação de email
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_confirmation();

-- 12. Criar função para obter estado do usuário
CREATE OR REPLACE FUNCTION public.get_user_state(user_id UUID)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  subscription_status subscription_status_enum,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR,
  can_access_dashboard BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.subscription_status,
    up.email_verified_at,
    up.stripe_customer_id,
    (up.subscription_status = 'active') as can_access_dashboard
  FROM public.user_profiles up
  WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Criar função para atualizar status de assinatura (para webhook do Stripe)
CREATE OR REPLACE FUNCTION public.update_subscription_status(
  user_email VARCHAR,
  customer_id VARCHAR,
  status subscription_status_enum
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE public.user_profiles 
  SET 
    subscription_status = status,
    stripe_customer_id = customer_id,
    updated_at = NOW()
  WHERE email = user_email;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Conceder permissões necessárias
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_state(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_subscription_status(VARCHAR, VARCHAR, subscription_status_enum) TO anon, authenticated;

COMMIT;