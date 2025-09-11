
-- 1. Habilitar extensão HTTP
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Criar função do webhook
CREATE OR REPLACE FUNCTION send_confirmation_email_webhook()
RETURNS trigger AS $$
DECLARE
    confirmation_url text;
    edge_function_url text;
    response http_response;
    app_url text;
    anon_key text;
BEGIN
    -- URLs configuradas (substitua pelos valores reais)
    app_url := 'http://localhost:5173';
    
    -- Construir URL de confirmação
    confirmation_url := app_url || '/confirm?token=' || NEW.confirmation_token;
    
    -- URL da Edge Function
    edge_function_url := 'https://fsntzljufghutoyqxokm.supabase.co/functions/v1/send-confirmation-email';
    
    -- Fazer requisição HTTP para a Edge Function
    SELECT * INTO response FROM http((
        'POST',
        edge_function_url,
        ARRAY[http_header('Content-Type', 'application/json'),
              http_header('Authorization', 'Bearer sb_publishable_anCt58SD2bi_7IMlgk5ZKg_bJ-T7RJQ')],
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

-- 3. Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.confirmation_token IS NOT NULL)
    EXECUTE FUNCTION send_confirmation_email_webhook();
