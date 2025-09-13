import { createClient } from '@supabase/supabase-js';

// Validar variáveis de ambiente
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL é obrigatória');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY é obrigatória');
}

// Criar cliente Supabase com service role key para operações administrativas
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Cliente público para operações do frontend (se necessário)
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

/**
 * Função para testar conexão com Supabase
 */
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Erro na conexão com Supabase:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com Supabase:', error.message);
    return false;
  }
};

/**
 * Função para criar tabelas necessárias (se não existirem)
 */
const createTables = async () => {
  try {
    // Criar tabela de usuários
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(255),
        subscription_status VARCHAR(50) DEFAULT 'pending_email' CHECK (subscription_status IN ('pending_email', 'pending_subscription', 'active', 'cancelled', 'expired')),
        email_verified_at TIMESTAMP WITH TIME ZONE,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        verification_token TEXT,
        verification_token_expires TIMESTAMP WITH TIME ZONE,
        last_login_at TIMESTAMP WITH TIME ZONE,
        last_logout_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Criar tabela de tokens de verificação
    const createTokensTable = `
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Criar tabela de logs de auditoria
    const createAuditLogsTable = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Criar índices para performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
      CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    `;

    // Executar queries
    await supabase.rpc('exec_sql', { sql: createUsersTable });
    await supabase.rpc('exec_sql', { sql: createTokensTable });
    await supabase.rpc('exec_sql', { sql: createAuditLogsTable });
    await supabase.rpc('exec_sql', { sql: createIndexes });

    console.log('✅ Tabelas criadas/verificadas com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    return false;
  }
};

/**
 * Função para limpar tokens expirados
 */
const cleanupExpiredTokens = async () => {
  try {
    const { error } = await supabase
      .from('verification_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Erro ao limpar tokens expirados:', error);
      return false;
    }

    console.log('✅ Tokens expirados limpos com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar tokens expirados:', error);
    return false;
  }
};

/**
 * Função para obter estatísticas do banco
 */
const getDatabaseStats = async () => {
  try {
    const { data: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { data: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active');

    const { data: pendingUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'pending_subscription');

    return {
      totalUsers: userCount?.count || 0,
      activeUsers: activeUsers?.count || 0,
      pendingUsers: pendingUsers?.count || 0
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return null;
  }
};

/**
 * Função para backup de dados críticos
 */
const backupCriticalData = async () => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, subscription_status, created_at, updated_at');

    if (error) {
      console.error('Erro no backup:', error);
      return null;
    }

    return {
      timestamp: new Date().toISOString(),
      users: users || []
    };
  } catch (error) {
    console.error('Erro no backup:', error);
    return null;
  }
};

// Executar limpeza de tokens expirados a cada hora
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupExpiredTokens, 60 * 60 * 1000); // 1 hora
}

export {   supabase,   supabasePublic,   testConnection,   createTables,   cleanupExpiredTokens,   getDatabaseStats,   backupCriticalData };