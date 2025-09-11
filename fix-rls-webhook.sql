-- Script para corrigir RLS e permitir que o webhook funcione
-- Execute este SQL no dashboard do Supabase

-- 1. Desabilitar RLS temporariamente para teste
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Ou criar política que permite inserção via trigger
CREATE POLICY "Allow webhook inserts" ON user_profiles
    FOR INSERT
    WITH CHECK (true);

-- 3. Permitir que a função de trigger acesse a tabela
GRANT INSERT ON user_profiles TO authenticated;
GRANT INSERT ON user_profiles TO anon;

-- 4. Verificar se a função do webhook existe
SELECT proname FROM pg_proc WHERE proname = 'send_confirmation_email_webhook';

-- 5. Verificar se o trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 6. Se necessário, recriar a função com SECURITY DEFINER
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

-- 7. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.confirmation_token IS NOT NULL)
    EXECUTE FUNCTION send_confirmation_email_webhook();

-- 8. Comentários
/*
Este script:
1. Desabilita RLS na tabela user_profiles (temporário)
2. Cria política para permitir inserções via webhook
3. Concede permissões necessárias
4. Recria a função e trigger do webhook

Após executar, teste com: node test-webhook-simple.js
*/