-- Script completo para configurar o banco de dados do NCM Pro
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Limpar configurações anteriores (se existirem)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.generate_totp_backup_codes();
DROP FUNCTION IF EXISTS public.validate_backup_code(UUID, TEXT);
DROP TABLE IF EXISTS public.user_profiles;

-- 2. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. Criar tabela user_profiles completa
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    subscription_type TEXT DEFAULT 'pending',
    subscription_status TEXT DEFAULT 'pending',
    
    -- Campos TOTP
    totp_secret TEXT,
    totp_enabled BOOLEAN DEFAULT FALSE,
    totp_backup_codes TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar índices para performance
CREATE INDEX idx_user_profiles_totp_enabled ON public.user_profiles(totp_enabled);
CREATE INDEX idx_user_profiles_subscription ON public.user_profiles(subscription_type, subscription_status);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
-- Política para leitura (usuários autenticados podem ler seus próprios dados)
CREATE POLICY "Users can read own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para inserção (sistema pode inserir durante cadastro)
CREATE POLICY "Enable insert for authenticated users" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização (usuários podem atualizar seus próprios dados)
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política especial para campos TOTP (apenas o próprio usuário)
CREATE POLICY "Users can manage own TOTP" ON public.user_profiles
    FOR ALL USING (auth.uid() = id);

-- 7. Função para gerar códigos de backup TOTP
CREATE OR REPLACE FUNCTION public.generate_totp_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
    codes TEXT[] := '{}';
    i INTEGER;
BEGIN
    -- Gerar 10 códigos de backup de 8 dígitos
    FOR i IN 1..10 LOOP
        codes := array_append(codes, LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0'));
    END LOOP;
    
    RETURN codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função para validar código de backup
CREATE OR REPLACE FUNCTION public.validate_backup_code(user_id UUID, backup_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_codes TEXT[];
    updated_codes TEXT[] := '{}';
    code TEXT;
    code_found BOOLEAN := FALSE;
BEGIN
    -- Buscar códigos do usuário
    SELECT totp_backup_codes INTO user_codes
    FROM public.user_profiles
    WHERE id = user_id;
    
    IF user_codes IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se o código existe e removê-lo da lista
    FOREACH code IN ARRAY user_codes LOOP
        IF code = backup_code THEN
            code_found := TRUE;
        ELSE
            updated_codes := array_append(updated_codes, code);
        END IF;
    END LOOP;
    
    -- Se o código foi encontrado, atualizar a lista sem ele
    IF code_found THEN
        UPDATE public.user_profiles
        SET totp_backup_codes = updated_codes,
            updated_at = NOW()
        WHERE id = user_id;
    END IF;
    
    RETURN code_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Função principal para handle de novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Log para debug
    RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
    
    -- Inserir perfil do usuário
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        subscription_type,
        subscription_status,
        totp_enabled,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
        'pending',
        'pending',
        FALSE,
        NOW(),
        NOW()
    );
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        -- Não falhar o cadastro se houver erro na criação do perfil
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Criar trigger para novos usuários
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 11. Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Verificação final - mostrar status de todos os objetos criados
SELECT 
    'user_profiles table' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

UNION ALL

SELECT 
    'handle_new_user function' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

UNION ALL

SELECT 
    'on_auth_user_created trigger' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

UNION ALL

SELECT 
    'generate_totp_backup_codes function' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'generate_totp_backup_codes'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

UNION ALL

SELECT 
    'validate_backup_code function' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'validate_backup_code'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

UNION ALL

SELECT 
    'RLS Policies' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles'
    ) THEN '✅ Created (' || COUNT(*)::TEXT || ' policies)' ELSE '❌ Missing' END as status
FROM pg_policies 
WHERE tablename = 'user_profiles'

ORDER BY object_type;

-- 14. Mostrar estrutura da tabela criada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Fim do script
-- 
-- INSTRUÇÕES DE USO:
-- 1. Copie todo este conteúdo
-- 2. Acesse o Supabase Dashboard
-- 3. Vá em SQL Editor
-- 4. Cole o script completo
-- 5. Execute com Ctrl+Enter ou botão Run
-- 6. Verifique se todos os objetos mostram ✅ Created
-- 7. Teste o cadastro com: node test-signup.js