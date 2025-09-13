-- Criar tabela para tokens de verificação de email
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token UUID NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- Habilitar RLS
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios tokens
CREATE POLICY "Users can view own verification tokens" ON email_verification_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir inserção de tokens (para a função de email)
CREATE POLICY "Allow token insertion" ON email_verification_tokens
    FOR INSERT WITH CHECK (true);

-- Política para permitir atualização de tokens (marcar como usado)
CREATE POLICY "Allow token updates" ON email_verification_tokens
    FOR UPDATE USING (true);

-- Função para limpar tokens expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM email_verification_tokens 
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE email_verification_tokens IS 'Armazena tokens de verificação de email com expiração';
COMMENT ON COLUMN email_verification_tokens.user_id IS 'ID do usuário que precisa verificar o email';
COMMENT ON COLUMN email_verification_tokens.token IS 'Token único de verificação';
COMMENT ON COLUMN email_verification_tokens.expires_at IS 'Data/hora de expiração do token';
COMMENT ON COLUMN email_verification_tokens.used_at IS 'Data/hora quando o token foi usado (NULL se não usado)';