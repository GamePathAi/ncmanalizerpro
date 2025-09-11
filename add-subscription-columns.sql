-- Script para adicionar colunas de assinatura à tabela user_profiles
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Adicionar colunas relacionadas ao Stripe
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;

-- 2. Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_id ON public.user_profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_id ON public.user_profiles(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);

-- 3. Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Criar um usuário de teste com assinatura ativa (opcional)
-- Descomente as linhas abaixo se quiser criar um usuário de teste

/*
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    subscription_status,
    subscription_type,
    customer_id,
    subscription_id,
    subscription_start_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'test-user@example.com',
    'Usuário Teste',
    'active',
    'annual',
    'cus_test_' || extract(epoch from now()),
    'sub_test_' || extract(epoch from now()),
    now(),
    now(),
    now()
) ON CONFLICT (email) DO UPDATE SET
    subscription_status = EXCLUDED.subscription_status,
    subscription_type = EXCLUDED.subscription_type,
    customer_id = EXCLUDED.customer_id,
    subscription_id = EXCLUDED.subscription_id,
    subscription_start_date = EXCLUDED.subscription_start_date,
    updated_at = now();
*/

-- 5. Verificar se o usuário de teste foi criado
-- SELECT * FROM public.user_profiles WHERE email = 'test-user@example.com';

-- 6. Verificar todos os usuários com assinatura ativa
SELECT 
    email,
    subscription_status,
    subscription_type,
    customer_id,
    subscription_id,
    subscription_start_date
FROM public.user_profiles 
WHERE subscription_status = 'active'
ORDER BY created_at DESC;