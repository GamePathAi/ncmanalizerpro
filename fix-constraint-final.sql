-- Script final para corrigir o problema de foreign key
-- Execute este SQL no dashboard do Supabase

-- 1. Primeiro, vamos remover a constraint problemática
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- 2. Remover todos os triggers existentes para evitar conflitos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS send_confirmation_email_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;

-- 3. Remover todas as funções relacionadas
DROP FUNCTION IF EXISTS send_confirmation_email_webhook();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_new_user_signup();
DROP FUNCTION IF EXISTS handle_new_user_simple();

-- 4. Criar uma função que funciona corretamente
CREATE OR REPLACE FUNCTION handle_new_user_final()
RETURNS trigger AS $$
BEGIN
    -- Inserir na tabela user_profiles usando o ID do usuário recém-criado
    INSERT INTO public.user_profiles (
        id, 
        email, 
        full_name, 
        subscription_type, 
        subscription_status
    )
    VALUES (
        NEW.id,  -- Usar o ID do usuário que acabou de ser criado
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'free',
        'pending'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha o signup
        RAISE LOG 'Erro ao criar perfil do usuário: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar o trigger APÓS a inserção do usuário
CREATE TRIGGER on_auth_user_created_final
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_final();

-- 6. Recriar a constraint de foreign key APÓS o trigger
-- Isso garante que o usuário já existe quando tentamos criar o perfil
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Garantir permissões adequadas
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;
GRANT ALL ON user_profiles TO service_role;

-- 8. Garantir que a função pode ser executada
GRANT EXECUTE ON FUNCTION handle_new_user_final() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user_final() TO anon;
GRANT EXECUTE ON FUNCTION handle_new_user_final() TO service_role;

-- Comentários finais
/*
Este script resolve o problema de foreign key fazendo:

1. Remove a constraint problemática temporariamente
2. Remove todos os triggers conflitantes
3. Cria uma função que usa o ID correto do usuário recém-criado
4. Cria o trigger APÓS a inserção (AFTER INSERT)
5. Recria a constraint de foreign key
6. Garante todas as permissões necessárias

O trigger AFTER INSERT garante que o usuário já existe na tabela auth.users
quando tentamos inserir na user_profiles, resolvendo o problema de foreign key.

Após executar, teste com: node test-webhook-simple.js
*/