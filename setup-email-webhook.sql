-- Configuração do webhook para email de confirmação
-- Este script configura o trigger e função para enviar emails automaticamente

-- 1. Habilitar extensão HTTP (necessária para fazer requisições)
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION send_confirmation_email_webhook()
RETURNS trigger AS $$
DECLARE
    confirmation_url text;
    edge_function_url text;
    response http_response;
BEGIN
    -- Construir URL de confirmação
    confirmation_url := 'https://your-app-domain.com/confirm?token=' || NEW.confirmation_token;
    
    -- URL da Edge Function (substitua pela sua URL do projeto Supabase)
    edge_function_url := 'https://your-project-ref.supabase.co/functions/v1/send-confirmation-email';
    
    -- Fazer requisição HTTP para a Edge Function
    SELECT * INTO response FROM http((
        'POST',
        edge_function_url,
        ARRAY[http_header('Content-Type', 'application/json'),
              http_header('Authorization', 'Bearer YOUR_ANON_KEY')],
        json_build_object(
            'email', NEW.email,
            'confirmation_url', confirmation_url
        )::text
    ));
    
    -- Log da resposta (opcional)
    RAISE LOG 'Email webhook response: %', response.status;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger que chama a função quando um usuário é inserido
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.confirmation_token IS NOT NULL)
    EXECUTE FUNCTION send_confirmation_email_webhook();

-- 4. Comentários de configuração
/*
Para usar este script:

1. Substitua 'your-app-domain.com' pela URL do seu app
2. Substitua 'your-project-ref' pela referência do seu projeto Supabase
3. Substitua 'YOUR_ANON_KEY' pela sua chave anônima do Supabase
4. Execute este script no SQL Editor do Supabase Dashboard

Variáveis de ambiente necessárias no Supabase:
- RESEND_API_KEY: Sua chave da API do Resend
- FROM_EMAIL: Email remetente verificado
- FROM_NAME: Nome do remetente
- APP_URL: URL base da sua aplicação
*/