-- Script para corrigir o erro "Database error saving new user"
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Primeiro, vamos limpar qualquer configuração anterior
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_profiles;

-- 2. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Criar tabela user_profiles com estrutura correta
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    subscription_type TEXT DEFAULT 'pending',
    subscription_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS mais permissivas para debug
CREATE POLICY "Enable read access for authenticated users" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on id" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- 6. Criar função para handle do novo usuário (versão mais robusta)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Log para debug
    RAISE LOG 'Creating profile for user: %', NEW.id;
    
    -- Inserir perfil do usuário
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
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

-- 7. Criar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. Verificar se tudo foi criado corretamente
SELECT 
    'user_profiles table' as object_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
         THEN '✅ Created' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'handle_new_user function' as object_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') 
         THEN '✅ Created' 
         ELSE '❌ Missing' 
    END as status
UNION ALL
SELECT 
    'on_auth_user_created trigger' as object_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
         THEN '✅ Created' 
         ELSE '❌ Missing' 
    END as status;

-- 9. Testar a função manualmente (opcional)
-- INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com');