-- ========================================
-- EXECUTAR NO SUPABASE DASHBOARD
-- ========================================
-- Vá para: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/sql
-- Cole este SQL e execute

-- 1. Criar tabela para tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- 3. Habilitar RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
CREATE POLICY "Allow insert password reset tokens" ON password_reset_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read password reset tokens" ON password_reset_tokens
  FOR SELECT USING (true);

CREATE POLICY "Allow update password reset tokens" ON password_reset_tokens
  FOR UPDATE USING (true);

-- 5. Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION clean_expired_password_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Comentários para documentação
COMMENT ON TABLE password_reset_tokens IS 'Tabela para armazenar tokens de recuperação de senha';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'ID do usuário que solicitou a recuperação';
COMMENT ON COLUMN password_reset_tokens.email IS 'Email do usuário';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único para recuperação';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data/hora de expiração do token';
COMMENT ON COLUMN password_reset_tokens.used IS 'Se o token já foi utilizado';

-- 7. Verificar se a tabela foi criada
SELECT 'Tabela password_reset_tokens criada com sucesso!' as status;
SELECT COUNT(*) as total_tokens FROM password_reset_tokens;