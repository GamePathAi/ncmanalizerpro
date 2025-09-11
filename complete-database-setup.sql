-- =====================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO DO BANCO DE DADOS
-- NCM Analyzer Pro - Supabase Setup
-- =====================================================

-- 1. CRIAR TABELA DE PERFIS DE USUÁRIO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    
    -- Campos de assinatura
    subscription_status VARCHAR(50) DEFAULT 'pending_email' CHECK (subscription_status IN ('pending_email', 'pending_subscription', 'active', 'canceled', 'expired')),
    subscription_type VARCHAR(50) CHECK (subscription_type IN ('monthly', 'annual', 'lifetime')),
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Campos do Stripe
    customer_id VARCHAR(255) UNIQUE,
    subscription_id VARCHAR(255) UNIQUE,
    
    -- Campos TOTP (autenticação de dois fatores)
    totp_secret VARCHAR(255),
    totp_enabled BOOLEAN DEFAULT FALSE,
    totp_backup_codes TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA DE ENDEREÇOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Dados do endereço
    type VARCHAR(20) DEFAULT 'billing' CHECK (type IN ('billing', 'shipping', 'both')),
    street VARCHAR(255) NOT NULL,
    number VARCHAR(20) NOT NULL,
    complement VARCHAR(100),
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    country VARCHAR(2) DEFAULT 'BR',
    
    -- Flags
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA DE CARTÕES DE PAGAMENTO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Dados do Stripe
    stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    
    -- Dados do cartão (apenas últimos 4 dígitos e metadata)
    card_brand VARCHAR(20), -- visa, mastercard, etc
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    card_country VARCHAR(2),
    
    -- Flags
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA DE LOGS DE EMAIL
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    
    -- Dados do email
    email_to VARCHAR(255) NOT NULL,
    email_subject VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL, -- confirmation, welcome, payment, etc
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    provider VARCHAR(50) DEFAULT 'resend',
    provider_message_id VARCHAR(255),
    error_message TEXT,
    
    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_id ON public.user_profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_id ON public.user_profiles(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

-- Índices para user_addresses
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_type ON public.user_addresses(type);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON public.user_addresses(is_default);
CREATE INDEX IF NOT EXISTS idx_user_addresses_zip_code ON public.user_addresses(zip_code);

-- Índices para user_payment_methods
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON public.user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_stripe_pm_id ON public.user_payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_is_default ON public.user_payment_methods(is_default);

-- Índices para email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- 6. CRIAR FUNÇÃO PARA GERAR CÓDIGOS TOTP
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_totp_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
    codes TEXT[] := '{}';
    i INTEGER;
    code TEXT;
BEGIN
    FOR i IN 1..10 LOOP
        code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        codes := array_append(codes, code);
    END LOOP;
    RETURN codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CRIAR FUNÇÃO PARA ATUALIZAR TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. CRIAR FUNÇÃO PARA LIDAR COM NOVOS USUÁRIOS
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        subscription_status,
        totp_backup_codes
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        CASE 
            WHEN NEW.email_confirmed_at IS NOT NULL THEN 'pending_subscription'
            ELSE 'pending_email'
        END,
        public.generate_totp_backup_codes()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. CRIAR TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON public.user_addresses;
CREATE TRIGGER update_user_addresses_updated_at
    BEFORE UPDATE ON public.user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON public.user_payment_methods;
CREATE TRIGGER update_user_payment_methods_updated_at
    BEFORE UPDATE ON public.user_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 10. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;
CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Políticas para user_addresses
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.user_addresses;
CREATE POLICY "Users can manage own addresses" ON public.user_addresses
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para user_payment_methods
DROP POLICY IF EXISTS "Users can manage own payment methods" ON public.user_payment_methods;
CREATE POLICY "Users can manage own payment methods" ON public.user_payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para email_logs
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
CREATE POLICY "Users can view own email logs" ON public.email_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage email logs" ON public.email_logs;
CREATE POLICY "Service role can manage email logs" ON public.email_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 11. CRIAR CONSTRAINTS ADICIONAIS
-- =====================================================

-- Garantir que apenas um endereço padrão por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_addresses_default_unique 
ON public.user_addresses(user_id) 
WHERE is_default = TRUE;

-- Garantir que apenas um método de pagamento padrão por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_payment_methods_default_unique 
ON public.user_payment_methods(user_id) 
WHERE is_default = TRUE;

-- 12. INSERIR DADOS DE TESTE (OPCIONAL)
-- =====================================================
/*
-- Descomente para criar um usuário de teste
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    subscription_status,
    subscription_type,
    customer_id,
    subscription_id,
    subscription_start_date,
    totp_backup_codes
) VALUES (
    gen_random_uuid(),
    'test-user@example.com',
    'Usuário Teste',
    'active',
    'annual',
    'cus_test_' || extract(epoch from now()),
    'sub_test_' || extract(epoch from now()),
    now(),
    public.generate_totp_backup_codes()
) ON CONFLICT (email) DO UPDATE SET
    subscription_status = EXCLUDED.subscription_status,
    subscription_type = EXCLUDED.subscription_type,
    customer_id = EXCLUDED.customer_id,
    subscription_id = EXCLUDED.subscription_id,
    subscription_start_date = EXCLUDED.subscription_start_date,
    updated_at = now();
*/

-- 13. VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar estrutura das tabelas criadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_addresses', 'user_payment_methods', 'email_logs')
ORDER BY table_name, ordinal_position;

-- Verificar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_addresses', 'user_payment_methods', 'email_logs')
ORDER BY tablename, indexname;

-- Verificar funções criadas
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'generate_totp_backup_codes', 'update_updated_at_column');

-- Verificar triggers criados
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- SCRIPT CONCLUÍDO!
-- =====================================================
-- 
-- Este script criou:
-- ✅ Tabela user_profiles com todos os campos necessários
-- ✅ Tabela user_addresses para endereços
-- ✅ Tabela user_payment_methods para cartões
-- ✅ Tabela email_logs para logs de email
-- ✅ Índices para performance
-- ✅ Funções auxiliares
-- ✅ Triggers automáticos
-- ✅ Políticas RLS para segurança
-- ✅ Constraints para integridade
-- 
-- Próximos passos:
-- 1. Execute este script no Supabase Dashboard > SQL Editor
-- 2. Verifique se todas as tabelas foram criadas
-- 3. Teste o signup de um usuário
-- 4. Configure as Edge Functions
-- =====================================================