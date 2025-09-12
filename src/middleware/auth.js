const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware para verificar token JWT
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de acesso requerido',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    // Verificar token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('Erro na verificação JWT:', jwtError.message);
      return res.status(401).json({ 
        error: 'Token expirado ou inválido',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Buscar usuário no banco
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('email', decoded.email);

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'DATABASE_ERROR'
      });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = users[0];

    // Adicionar usuário ao request
    req.user = {
      id: user.id,
      email: user.email,
      subscription_status: user.subscription_status,
      email_verified_at: user.email_verified_at,
      stripe_customer_id: user.stripe_customer_id,
      created_at: user.created_at
    };

    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware para verificar se email foi verificado
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (!req.user.email_verified_at) {
    return res.status(403).json({ 
      error: 'Email não verificado',
      code: 'EMAIL_NOT_VERIFIED',
      required_action: 'verify_email',
      redirect: '/verify-email'
    });
  }

  next();
};

/**
 * Middleware para verificar assinatura ativa
 */
const requireActiveSubscription = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.subscription_status !== 'active') {
    return res.status(403).json({ 
      error: 'Assinatura ativa requerida',
      code: 'SUBSCRIPTION_REQUIRED',
      current_status: req.user.subscription_status,
      required_action: 'subscribe',
      redirect: '/pricing'
    });
  }

  next();
};

/**
 * Middleware para verificar status específico do usuário
 */
const requireUserStatus = (allowedStatuses) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedStatuses.includes(req.user.subscription_status)) {
      return res.status(403).json({ 
        error: 'Status de usuário não permitido',
        code: 'INVALID_USER_STATUS',
        current_status: req.user.subscription_status,
        allowed_statuses: allowedStatuses
      });
    }

    next();
  };
};

/**
 * Middleware que permite acesso apenas para usuários com email confirmado
 * (inclui pending_subscription e active)
 */
const requireMinimumAccess = (req, res, next) => {
  if (req.user.subscription_status === 'pending_email') {
    return res.status(403).json({
      error: 'Email não confirmado',
      code: 'EMAIL_NOT_VERIFIED',
      redirect: '/verify-email'
    });
  }
  next();
};

/**
 * Middleware combinado para diferentes níveis de acesso
 */
const authMiddleware = {
  // Apenas token válido
  authenticated: verifyToken,
  
  // Token + email verificado
  emailVerified: [verifyToken, requireEmailVerified],
  
  // Token + email verificado + assinatura ativa
  fullAccess: [verifyToken, requireEmailVerified, requireActiveSubscription],
  
  // Acesso para usuários que podem fazer login mas ainda não assinaram
  canLogin: [verifyToken, requireUserStatus(['pending_subscription', 'active'])],
  
  // Apenas usuários com email pendente
  pendingEmail: [verifyToken, requireUserStatus(['pending_email'])],
  
  // Apenas usuários com assinatura pendente
  pendingSubscription: [verifyToken, requireUserStatus(['pending_subscription'])],
  
  // Apenas usuários ativos
  activeOnly: [verifyToken, requireUserStatus(['active'])],
  
  // Acesso mínimo (email verificado)
  minimumAccess: [verifyToken, requireMinimumAccess]
};

/**
 * Middleware opcional - não falha se não houver token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      req.user = null;
      return next();
    }

    // Tentar verificar token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Buscar usuário
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('email', decoded.email);

      if (!error && users && users.length > 0) {
        const user = users[0];
        req.user = {
          id: user.id,
          email: user.email,
          subscription_status: user.subscription_status,
          email_verified_at: user.email_verified_at,
          stripe_customer_id: user.stripe_customer_id,
          created_at: user.created_at
        };
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação opcional:', error);
    req.user = null;
    next();
  }
};

/**
 * Rate limiting por usuário
 */
const createUserRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Limpar requests antigos
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }
    
    const userRequests = requests.get(userId);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Muitas requisições',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: Math.ceil(windowMs / 1000)
      });
    }
    
    userRequests.push(now);
    next();
  };
};

/**
 * Middleware para logs de auditoria
 */
const auditLog = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log da ação
      console.log('Audit Log:', {
        action,
        user_id: req.user?.id,
        user_email: req.user?.email,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        timestamp: new Date().toISOString()
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  verifyToken,
  requireEmailVerified,
  requireActiveSubscription,
  requireUserStatus,
  requireMinimumAccess,
  authMiddleware,
  optionalAuth,
  createUserRateLimit,
  auditLog
};