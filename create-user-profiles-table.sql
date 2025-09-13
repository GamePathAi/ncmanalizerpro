-- Script para criar a tabela user_profiles se não existir
-- Execute no SQL Editor do Supabase

-- Criar enum para status de assinatura se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
        CREATE TYPE subscription_status_enum AS ENUM ('pending_email', 'pending_subscription', 'active');
    END IF;
END$$;

-- Criar tabela user_profiles se não existir
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    subscription_status subscription_status_enum DEFAULT 'pending_email',
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Desabilitar RLS temporariamente para testes
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Verificar se a tabela foi criada
SELECT 'Tabela user_profiles criada/verificada e RLS desabilitado!' as status;