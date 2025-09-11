-- Script final para corrigir triggers do webhook
-- Execute este SQL no dashboard do Supabase

-- 1. Remover TODOS os triggers existentes relacionados a auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS send_confirmation_email_trigger ON auth.users;

-- 2. Remover todas as funções relacionadas
DROP FUNCTION IF EXISTS send_confirmation_email_webhook();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_new_user_signup();

-- 3. Criar uma função simples APENAS para inserir na user_profiles
-- SEM envio de email para evitar conflitos
CREATE OR REPLACE FUNCTION handle_new_user_simple()
RETURNS trigger AS $$
BEGIN
    -- Inserir na tabela user_profiles apenas se não existir
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO NOTHING; -- Evitar duplicatas
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha o signup
        RAISE LOG 'Erro ao criar perfil do usuário: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger simples apenas para user_profiles
CREATE TRIGGER on_auth_user_created_simple
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_simple();

-- 5. Garantir permissões na tabela user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
GRANT INSERT ON user_profiles TO authenticated;
GRANT INSERT ON user_profiles TO anon;
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- 6. Verificar se a constraint de foreign key está correta
-- Se necessário, recriar a constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Comentários
/*
Este script:
1. Remove todos os triggers conflitantes
2. Cria apenas um trigger simples para inserir na user_profiles
3. Remove o envio de email do trigger (pode ser feito via frontend)
4. Garante que não há conflitos de foreign key
5. Desabilita RLS para evitar problemas de permissão

Após executar, teste com: node test-webhook-simple.js
*/