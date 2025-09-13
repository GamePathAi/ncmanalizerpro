-- Script corrigido para recriar a função handle_new_user com SECURITY DEFINER, lidando com dependências

-- Primeiro, dropar o trigger que depende da função
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Agora, dropar a função existente
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Criar a função com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    password_hash,
    email_verified_at,
    subscription_status,
    stripe_customer_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.encrypted_password,
    NEW.email_confirmed_at,
    'pending_email'::subscription_status_enum,  -- Assumindo que o enum está criado
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verificar se o enum subscription_status_enum existe, criar se não
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
    CREATE TYPE subscription_status_enum AS ENUM ('pending_email', 'pending_subscription', 'active');
  END IF;
END
$$;

-- Alterar a tabela user_profiles para adicionar default ao subscription_status se necessário
ALTER TABLE public.user_profiles
ALTER COLUMN subscription_status SET DEFAULT 'pending_email'::subscription_status_enum;