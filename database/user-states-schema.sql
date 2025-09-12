-- =====================================================
-- SISTEMA DE AUTENTICAÇÃO COM ESTADOS DE USUÁRIO
-- =====================================================
-- Resolve o problema circular: usuário precisa estar logado para assinar,
-- mas precisa de assinatura para acessar o sistema

-- Criar enum para estados do usuário
CREATE TYPE user_subscription_status AS ENUM (
  'pending_email',      -- Usuário cadastrado mas não confirmou email
  'pending_subscription', -- Email confirmado mas sem assinatura ativa
  'active'              -- Email confirmado + assinatura ativa
);

-- Tabela de usuários estendida
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  subscription_status user_subscription_status DEFAULT 'pending_email',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_plan TEXT, -- 'basic', 'pro', 'enterprise'
  subscription_expires_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para tokens de verificação de email
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para logs de autenticação e segurança
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'login', 'register', 'verify_email', 'password_reset', 'suspicious_activity'
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    'pending_email'
  );
  
  -- Log do registro
  INSERT INTO auth_logs (user_id, event_type, metadata)
  VALUES (
    NEW.id,
    'register',
    jsonb_build_object(
      'email', NEW.email,
      'provider', COALESCE(NEW.app_metadata->>'provider', 'email')
    )
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar perfil automaticamente
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Função para verificar email
CREATE OR REPLACE FUNCTION verify_user_email(verification_token TEXT)
RETURNS JSONB AS $$
DECLARE
  token_record email_verification_tokens%ROWTYPE;
  user_record user_profiles%ROWTYPE;
BEGIN
  -- Buscar token válido
  SELECT * INTO token_record
  FROM email_verification_tokens
  WHERE token = verification_token
    AND expires_at > NOW()
    AND used_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token inválido ou expirado'
    );
  END IF;
  
  -- Marcar token como usado
  UPDATE email_verification_tokens
  SET used_at = NOW()
  WHERE id = token_record.id;
  
  -- Atualizar perfil do usuário
  UPDATE user_profiles
  SET 
    subscription_status = 'pending_subscription',
    email_verified_at = NOW()
  WHERE id = token_record.user_id
  RETURNING * INTO user_record;
  
  -- Confirmar email no auth.users
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = token_record.user_id;
  
  -- Log da verificação
  INSERT INTO auth_logs (user_id, event_type, metadata)
  VALUES (
    token_record.user_id,
    'verify_email',
    jsonb_build_object(
      'token_id', token_record.id,
      'verified_at', NOW()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_record.id,
    'subscription_status', user_record.subscription_status
  );
END;
$$ language 'plpgsql';

-- Função para ativar assinatura via Stripe
CREATE OR REPLACE FUNCTION activate_user_subscription(
  user_email TEXT,
  stripe_customer_id_param TEXT,
  stripe_subscription_id_param TEXT,
  subscription_plan_param TEXT DEFAULT 'basic'
)
RETURNS JSONB AS $$
DECLARE
  user_record user_profiles%ROWTYPE;
BEGIN
  -- Atualizar perfil do usuário
  UPDATE user_profiles
  SET 
    subscription_status = 'active',
    stripe_customer_id = stripe_customer_id_param,
    stripe_subscription_id = stripe_subscription_id_param,
    subscription_plan = subscription_plan_param,
    subscription_expires_at = NOW() + INTERVAL '1 month' -- Ajustar conforme plano
  WHERE email = user_email
    AND subscription_status = 'pending_subscription'
  RETURNING * INTO user_record;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado ou não elegível para ativação'
    );
  END IF;
  
  -- Log da ativação
  INSERT INTO auth_logs (user_id, event_type, metadata)
  VALUES (
    user_record.id,
    'subscription_activated',
    jsonb_build_object(
      'stripe_customer_id', stripe_customer_id_param,
      'stripe_subscription_id', stripe_subscription_id_param,
      'plan', subscription_plan_param
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_record.id,
    'subscription_status', user_record.subscription_status,
    'plan', user_record.subscription_plan
  );
END;
$$ language 'plpgsql';

-- Função para obter estado do usuário
CREATE OR REPLACE FUNCTION get_user_state(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  user_record user_profiles%ROWTYPE;
BEGIN
  SELECT * INTO user_record
  FROM user_profiles
  WHERE id = user_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'full_name', user_record.full_name,
      'subscription_status', user_record.subscription_status,
      'subscription_plan', user_record.subscription_plan,
      'subscription_expires_at', user_record.subscription_expires_at,
      'email_verified_at', user_record.email_verified_at,
      'created_at', user_record.created_at
    )
  );
END;
$$ language 'plpgsql';

-- Função para limpar tokens expirados (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_verification_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ language 'plpgsql';

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON user_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Políticas para email_verification_tokens
CREATE POLICY "Service role can manage verification tokens" ON email_verification_tokens
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Políticas para auth_logs
CREATE POLICY "Users can view own auth logs" ON auth_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all auth logs" ON auth_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- DADOS INICIAIS E CONFIGURAÇÕES
-- =====================================================

-- Inserir configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações padrão
INSERT INTO system_config (key, value, description) VALUES
('email_verification_expiry_hours', '24', 'Horas para expiração do token de verificação de email'),
('max_login_attempts', '5', 'Máximo de tentativas de login antes de bloquear'),
('subscription_plans', '{
  "basic": {
    "name": "Básico",
    "price": 29.90,
    "features": ["Análise NCM básica", "Suporte por email"]
  },
  "pro": {
    "name": "Profissional",
    "price": 59.90,
    "features": ["Análise NCM avançada", "API access", "Suporte prioritário"]
  },
  "enterprise": {
    "name": "Empresarial",
    "price": 199.90,
    "features": ["Análise ilimitada", "API completa", "Suporte dedicado"]
  }
}', 'Planos de assinatura disponíveis')
ON CONFLICT (key) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE user_profiles IS 'Perfis de usuário com estados de assinatura';
COMMENT ON COLUMN user_profiles.subscription_status IS 'Estado atual: pending_email, pending_subscription, active';
COMMENT ON TABLE email_verification_tokens IS 'Tokens para verificação de email com expiração';
COMMENT ON TABLE auth_logs IS 'Logs de eventos de autenticação e segurança';

-- Finalização
SELECT 'Schema de autenticação com estados criado com sucesso!' as status;