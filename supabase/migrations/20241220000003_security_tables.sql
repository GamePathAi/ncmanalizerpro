-- ============================================================================
-- MIGRAÇÃO: Tabelas de Segurança para Sistema de Autenticação
-- Data: 2024-12-20
-- Descrição: Cria tabelas para rate limiting, logs de segurança e IPs bloqueados
-- ============================================================================

-- 1. Tabela para Rate Limiting
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_limit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(50) NOT NULL, -- 'email_verification', 'login_attempts', etc.
    identifier VARCHAR(255) NOT NULL, -- email, IP, user_id
    success BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_action_identifier 
    ON rate_limit_logs(action, identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at 
    ON rate_limit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_action_created 
    ON rate_limit_logs(action, created_at);

-- 2. Tabela para Logs de Segurança
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL, -- 'login_attempt', 'signup_attempt', 'password_reset', etc.
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    details JSONB DEFAULT '{}',
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance e consultas de segurança
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type 
    ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id 
    ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_email 
    ON security_logs(email);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address 
    ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at 
    ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_risk_level 
    ON security_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_logs_success 
    ON security_logs(success);

-- 3. Tabela para IPs Bloqueados
-- ============================================================================
CREATE TABLE IF NOT EXISTS blocked_ips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    reason TEXT,
    blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address 
    ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_is_active 
    ON blocked_ips(is_active);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires_at 
    ON blocked_ips(expires_at);

-- 4. Tabela para Tokens de Verificação Seguros
-- ============================================================================
CREATE TABLE IF NOT EXISTS verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token VARCHAR(128) NOT NULL UNIQUE,
    token_type VARCHAR(50) NOT NULL, -- 'email_verification', 'password_reset', etc.
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token 
    ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id 
    ON verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email 
    ON verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at 
    ON verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_is_active 
    ON verification_tokens(is_active);

-- 5. Função para Limpeza Automática de Logs Antigos
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_security_data()
RETURNS void AS $$
BEGIN
    -- Limpar rate limit logs mais antigos que 7 dias
    DELETE FROM rate_limit_logs 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Limpar security logs mais antigos que 30 dias (exceto high risk)
    DELETE FROM security_logs 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND risk_level != 'high';
    
    -- Limpar security logs de alto risco mais antigos que 90 dias
    DELETE FROM security_logs 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND risk_level = 'high';
    
    -- Limpar tokens expirados
    DELETE FROM verification_tokens 
    WHERE expires_at < NOW()
    AND (used_at IS NOT NULL OR created_at < NOW() - INTERVAL '7 days');
    
    -- Desativar IPs bloqueados expirados
    UPDATE blocked_ips 
    SET is_active = false 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() 
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para Atualizar updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blocked_ips_updated_at
    BEFORE UPDATE ON blocked_ips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Políticas RLS (Row Level Security)
-- ============================================================================

-- Rate Limit Logs - Apenas leitura para usuários autenticados
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limit logs" ON rate_limit_logs
    FOR SELECT USING (
        auth.uid()::text = identifier OR 
        auth.email() = identifier
    );

-- Security Logs - Apenas leitura para usuários autenticados
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security logs" ON security_logs
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.email() = email
    );

-- Verification Tokens - Apenas leitura para o próprio usuário
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification tokens" ON verification_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Blocked IPs - Apenas leitura (sem acesso direto para usuários)
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- 8. Funções Auxiliares para Rate Limiting
-- ============================================================================

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_action VARCHAR(50),
    p_identifier VARCHAR(255),
    p_max_attempts INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
    allowed BOOLEAN,
    remaining_attempts INTEGER,
    reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_window_start TIMESTAMP WITH TIME ZONE;
    v_attempt_count INTEGER;
BEGIN
    -- Calcular início da janela de tempo
    v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Contar tentativas na janela
    SELECT COUNT(*) INTO v_attempt_count
    FROM rate_limit_logs
    WHERE action = p_action
    AND identifier = p_identifier
    AND created_at >= v_window_start;
    
    -- Retornar resultado
    RETURN QUERY SELECT
        (v_attempt_count < p_max_attempts) AS allowed,
        GREATEST(0, p_max_attempts - v_attempt_count) AS remaining_attempts,
        (NOW() + (p_window_minutes || ' minutes')::INTERVAL) AS reset_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar tentativa
CREATE OR REPLACE FUNCTION log_rate_limit_attempt(
    p_action VARCHAR(50),
    p_identifier VARCHAR(255),
    p_success BOOLEAN DEFAULT false,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO rate_limit_logs (action, identifier, success, metadata)
    VALUES (p_action, p_identifier, p_success, p_metadata)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Comentários para Documentação
-- ============================================================================

COMMENT ON TABLE rate_limit_logs IS 'Log de tentativas para controle de rate limiting';
COMMENT ON TABLE security_logs IS 'Log de eventos de segurança do sistema';
COMMENT ON TABLE blocked_ips IS 'Lista de IPs bloqueados por motivos de segurança';
COMMENT ON TABLE verification_tokens IS 'Tokens seguros para verificação de email e reset de senha';

COMMENT ON FUNCTION cleanup_old_security_data() IS 'Função para limpeza automática de dados antigos de segurança';
COMMENT ON FUNCTION check_rate_limit(VARCHAR, VARCHAR, INTEGER, INTEGER) IS 'Verifica se ação está dentro do limite de rate limiting';
COMMENT ON FUNCTION log_rate_limit_attempt(VARCHAR, VARCHAR, BOOLEAN, JSONB) IS 'Registra tentativa para controle de rate limiting';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

-- Executar limpeza inicial (opcional)
-- SELECT cleanup_old_security_data();

-- Verificar se as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('rate_limit_logs', 'security_logs', 'blocked_ips', 'verification_tokens')
ORDER BY tablename;