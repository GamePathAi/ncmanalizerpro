-- Criar usuário de teste simples
-- Este script cria um usuário diretamente na tabela auth.users e user_profiles

-- 1. Inserir usuário na tabela auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- 2. Inserir perfil na tabela user_profiles
INSERT INTO public.user_profiles (
  id,
  email,
  subscription_status,
  email_verified_at,
  stripe_customer_id,
  created_at,
  updated_at
) 
SELECT 
  u.id,
  u.email,
  'active',
  now(),
  'cus_test_' || extract(epoch from now())::text,
  now(),
  now()
FROM auth.users u 
WHERE u.email = 'test@example.com'
ON CONFLICT (id) DO UPDATE SET
  subscription_status = 'active',
  email_verified_at = now(),
  updated_at = now();

-- 3. Verificar se foi criado
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.subscription_status,
  p.stripe_customer_id
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE u.email = 'test@example.com';