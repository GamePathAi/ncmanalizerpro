-- Script para configurar o webhook do Resend
-- Execute este SQL no dashboard do Supabase

-- 1. Criar tabela para logs de email
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_id TEXT UNIQUE NOT NULL, -- ID do email no Resend
    email TEXT NOT NULL,
    subject TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    delayed_at TIMESTAMPTZ,
    complained_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_reason TEXT,
    opened_at TIMESTAMPTZ,
    open_count INTEGER DEFAULT 0,
    clicked_at TIMESTAMPTZ,
    click_count INTEGER DEFAULT 0,
    last_clicked_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_email_logs_email_id ON email_logs(email_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso
CREATE POLICY "Allow service role full access" ON email_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Conceder permissões
GRANT ALL ON email_logs TO service_role;
GRANT SELECT ON email_logs TO authenticated;

-- 6. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_email_logs_updated_at ON email_logs;
CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Atualizar a função de envio de email para salvar o log
CREATE OR REPLACE FUNCTION send_confirmation_email_webhook()
RETURNS trigger AS $$
DECLARE
    confirmation_url text;
    edge_function_url text;
    response http_response;
    email_response json;
    email_id text;
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
            'confirmationUrl', confirmation_url
        )::text
    ));
    
    -- Log da resposta
    RAISE LOG 'Email webhook response: % - %', response.status, response.content;
    
    -- Se a resposta foi bem-sucedida, tentar extrair o email_id
    IF response.status = 200 THEN
        BEGIN
            email_response := response.content::json;
            email_id := email_response->>'id';
            
            -- Salvar log inicial do email
            IF email_id IS NOT NULL THEN
                INSERT INTO email_logs (email_id, email, subject, status)
                VALUES (email_id, NEW.email, 'Confirme seu email - NCM Analyzer Pro', 'sent')
                ON CONFLICT (email_id) DO NOTHING;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE LOG 'Erro ao salvar log do email: %', SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Erro no webhook de email: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Comentários de configuração
/*
Após executar este SQL:

1. Deploy da Edge Function do webhook:
   supabase functions deploy resend-webhook

2. Configure o webhook no dashboard do Resend:
   - URL: https://seu-projeto.supabase.co/functions/v1/resend-webhook
   - Secret: whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo
   - Eventos: email.sent, email.delivered, email.bounced, email.opened, email.clicked

3. Teste o webhook:
   node test-resend-webhook.js

A tabela email_logs armazenará:
- Status de entrega dos emails
- Estatísticas de abertura e cliques
- Informações de bounce e reclamações
- Histórico completo de cada email enviado
*/