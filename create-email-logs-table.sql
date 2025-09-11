-- Script SQL para criar a tabela email_logs e configurar o webhook do Resend
-- Execute este SQL diretamente no SQL Editor do dashboard do Supabase

-- 1. Criar tabela email_logs
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_id TEXT UNIQUE NOT NULL,
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

-- 4. Criar política para permitir acesso total ao service role
DROP POLICY IF EXISTS "Allow service role full access" ON email_logs;
CREATE POLICY "Allow service role full access" ON email_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_email_logs_updated_at ON email_logs;
CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Inserir um registro de teste
INSERT INTO email_logs (email_id, email, subject, status)
VALUES ('test-setup-' || extract(epoch from now()), 'teste@exemplo.com', 'Teste de configuração do webhook', 'sent')
ON CONFLICT (email_id) DO NOTHING;

-- 8. Verificar se a tabela foi criada corretamente
SELECT 
    'Tabela email_logs criada com sucesso!' as message,
    count(*) as total_records
FROM email_logs;

-- Comentários sobre configuração:
-- 
-- PRÓXIMOS PASSOS:
-- 1. Execute este SQL no dashboard do Supabase (SQL Editor)
-- 2. Configure o webhook no dashboard do Resend:
--    - URL: https://fsntzljufghutoyqxokm.supabase.co/functions/v1/resend-webhook
--    - Secret: whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo
--    - Eventos: email.sent, email.delivered, email.bounced, email.opened, email.clicked
-- 3. Teste enviando um email através do seu app
-- 4. Monitore os logs: supabase functions logs resend-webhook
-- 5. Verifique os dados: SELECT * FROM email_logs ORDER BY created_at DESC;