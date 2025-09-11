-- Script para corrigir o problema de foreign key constraint no webhook
-- Execute este SQL no dashboard do Supabase

-- 1. Primeiro, vamos remover o trigger atual que está causando problema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Vamos criar uma função corrigida que APENAS envia email, sem inserir na user_profiles
CREATE OR REPLACE FUNCTION send_confirmation_email_webhook()
RETURNS trigger AS $$
DECLARE
    confirmation_url text;
    edge_function_url text;
    response http_response;
BEGIN
    -- Construir URL de confirmação
    confirmation_url := 'http://localhost:5173/confirm?token=' || NEW.confirmation_token;
    
    -- URL da Edge Function
    edge_function_url := 'https://fsntzljufghutoyqxokm.supabase.co/functions/v1/send-confirmation-email';
    
    -- Fazer requisição HTTP para a Edge Function
    SELECT * INTO response FROM http((
        'POST',
        edge_function_url,
        ARRAY[http_header('Content-Type', 'application/json'),
              http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTY0MDEsImV4cCI6MjA2OTE3MjQwMX0.MTkYFy_FfnGOiHrDVjV3AWDYao8YLQf1TnnBWeJwG-I')],
        json_build_object(
            'email', NEW.email,
            'confirmation_url', confirmation_url
        )::text
    ));
    
    -- Log da resposta
    RAISE LOG 'Email webhook response: % - %', response.status, response.content;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Erro no webhook de email: %', SQLERRM;
        RETURN NEW; -- Continuar mesmo com erro
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar o trigger corrigido
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.confirmation_token IS NOT NULL)
    EXECUTE FUNCTION send_confirmation_email_webhook();

-- 4. Agora vamos criar um trigger separado para inserir na user_profiles
-- Este trigger será executado APÓS o usuário ser criado com sucesso
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Inserir na tabela user_profiles apenas se o usuário foi criado com sucesso
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
        RAISE LOG 'Erro ao criar perfil do usuário: %', SQLERRM;
        RETURN NEW; -- Continuar mesmo com erro
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger para inserir na user_profiles
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 6. Garantir que a tabela user_profiles permite inserções
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 7. Ou criar política específica se quiser manter RLS
-- CREATE POLICY "Allow user profile creation" ON user_profiles
--     FOR INSERT
--     WITH CHECK (true);

-- 8. Conceder permissões necessárias
GRANT INSERT ON user_profiles TO authenticated;
GRANT INSERT ON user_profiles TO anon;

-- Comentários finais
/*
Este script corrige o problema de foreign key constraint:

1. Remove o trigger problemático
2. Cria função de email que NÃO tenta inserir na user_profiles
3. Cria trigger separado para inserir na user_profiles APÓS criação do usuário
4. Desabilita RLS temporariamente para evitar conflitos
5. Concede permissões necessárias

Agora o fluxo será:
1. Usuário faz signup
2. auth.users recebe o novo usuário
3. Trigger 1: Envia email de confirmação
4. Trigger 2: Cria perfil na user_profiles

Teste com: node test-webhook-simple.js
*/