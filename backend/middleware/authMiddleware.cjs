const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Configurações do Supabase não encontradas');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO BASEADO EM ESTADOS
// =====================================================

/**
 * Middleware para verificar JWT/sessão válida
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acesso não fornecido',
        code: 'NO_TOKEN',
        redirect: '/auth/login'
      });
    }

    // Verificar token com Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN',
        redirect: '/auth/login'
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    req.token = token;
    next();

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware para verificar estado do usuário e redirecionar conforme necessário
 */
const checkUserState = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED',
        redirect: '/auth/login'
      });
    }

    // Buscar perfil do usuário
    const { data: userProfile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !userProfile) {
      return res.status(404).json({
        error: 'Perfil de usuário não encontrado',
        code: 'PROFILE_NOT_FOUND',
        redirect: '/auth/register'
      });
    }

    // Adicionar perfil ao request
    req.userProfile = userProfile;
    next();

  } catch (error) {
    console.error('Erro ao verificar estado do usuário:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware para permitir apenas usuários com email verificado
 * Estado: pending_subscription ou active
 */
const requireEmailVerified = (req, res, next) => {
  const userProfile = req.userProfile;

  if (!userProfile) {
    return res.status(401).json({
      error: 'Perfil de usuário não encontrado',
      code: 'PROFILE_NOT_FOUND'
    });
  }

  if (userProfile.subscription_status === 'pending_email') {
    return res.status(403).json({
      error: 'Email não verificado. Verifique sua caixa de entrada.',
      code: 'EMAIL_NOT_VERIFIED',
      subscription_status: 'pending_email',
      redirect: '/auth/verify-email',
      user: {
        id: userProfile.id,
        email: userProfile.email,
        subscription_status: userProfile.subscription_status
      }
    });
  }

  next();
};

/**
 * Middleware para permitir apenas usuários com assinatura ativa
 * Estado: active
 */
const requireActiveSubscription = (req, res, next) => {
  const userProfile = req.userProfile;

  if (!userProfile) {
    return res.status(401).json({
      error: 'Perfil de usuário não encontrado',
      code: 'PROFILE_NOT_FOUND'
    });
  }

  // Verificar se email foi verificado primeiro
  if (userProfile.subscription_status === 'pending_email') {
    return res.status(403).json({
      error: 'Email não verificado',
      code: 'EMAIL_NOT_VERIFIED',
      subscription_status: 'pending_email',
      redirect: '/auth/verify-email'
    });
  }

  // Verificar se tem assinatura ativa
  if (userProfile.subscription_status === 'pending_subscription') {
    return res.status(403).json({
      error: 'Assinatura necessária para acessar este recurso',
      code: 'SUBSCRIPTION_REQUIRED',
      subscription_status: 'pending_subscription',
      redirect: '/pricing',
      user: {
        id: userProfile.id,
        email: userProfile.email,
        subscription_status: userProfile.subscription_status
      }
    });
  }

  // Verificar se assinatura não expirou
  if (userProfile.subscription_expires_at) {
    const expirationDate = new Date(userProfile.subscription_expires_at);
    const now = new Date();
    
    if (expirationDate < now) {
      // Atualizar status para pending_subscription
      supabaseAdmin
        .from('user_profiles')
        .update({ subscription_status: 'pending_subscription' })
        .eq('id', userProfile.id)
        .then(() => {
          console.log(`Assinatura expirada para usuário ${userProfile.id}`);
        })
        .catch(console.error);

      return res.status(403).json({
        error: 'Assinatura expirada. Renove para continuar usando o serviço.',
        code: 'SUBSCRIPTION_EXPIRED',
        subscription_status: 'pending_subscription',
        redirect: '/pricing',
        expired_at: userProfile.subscription_expires_at
      });
    }
  }

  next();
};

/**
 * Middleware para permitir apenas usuários em estado específico
 */
const requireUserState = (allowedStates) => {
  return (req, res, next) => {
    const userProfile = req.userProfile;

    if (!userProfile) {
      return res.status(401).json({
        error: 'Perfil de usuário não encontrado',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    if (!allowedStates.includes(userProfile.subscription_status)) {
      const redirectMap = {
        'pending_email': '/auth/verify-email',
        'pending_subscription': '/pricing',
        'active': '/dashboard'
      };

      return res.status(403).json({
        error: `Acesso negado. Estado atual: ${userProfile.subscription_status}`,
        code: 'INVALID_USER_STATE',
        subscription_status: userProfile.subscription_status,
        redirect: redirectMap[userProfile.subscription_status] || '/auth/login',
        allowed_states: allowedStates
      });
    }

    next();
  };
};

/**
 * Middleware combinado para autenticação completa
 * Verifica token + estado do usuário
 */
const authenticate = [verifyToken, checkUserState];

/**
 * Middleware para rotas que precisam de email verificado
 */
const authenticateEmailVerified = [
  verifyToken,
  checkUserState,
  requireEmailVerified
];

/**
 * Middleware para rotas que precisam de assinatura ativa
 */
const authenticateActiveSubscription = [
  verifyToken,
  checkUserState,
  requireActiveSubscription
];

/**
 * Middleware para verificar se usuário é admin/service role
 */
const requireAdmin = (req, res, next) => {
  const userProfile = req.userProfile;

  if (!userProfile || userProfile.subscription_plan !== 'enterprise') {
    return res.status(403).json({
      error: 'Acesso negado. Privilégios de administrador necessários.',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Middleware opcional - não falha se não autenticado
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
        
        // Buscar perfil se usuário autenticado
        const { data: userProfile } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (userProfile) {
          req.userProfile = userProfile;
        }
      }
    }

    next();
  } catch (error) {
    // Continuar mesmo com erro na autenticação opcional
    next();
  }
};

/**
 * Função helper para verificar permissões específicas
 */
const hasPermission = (userProfile, permission) => {
  if (!userProfile) return false;

  const permissions = {
    'basic': ['read_ncm', 'basic_analysis'],
    'pro': ['read_ncm', 'basic_analysis', 'advanced_analysis', 'api_access'],
    'enterprise': ['read_ncm', 'basic_analysis', 'advanced_analysis', 'api_access', 'admin_access', 'bulk_operations']
  };

  const userPermissions = permissions[userProfile.subscription_plan] || [];
  return userPermissions.includes(permission);
};

/**
 * Middleware para verificar permissão específica
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    const userProfile = req.userProfile;

    if (!hasPermission(userProfile, permission)) {
      return res.status(403).json({
        error: `Permissão '${permission}' necessária`,
        code: 'PERMISSION_DENIED',
        required_permission: permission,
        user_plan: userProfile?.subscription_plan || 'none'
      });
    }

    next();
  };
};

// =====================================================
// FUNÇÕES HELPER PARA FRONTEND
// =====================================================

/**
 * Função para determinar redirecionamento baseado no estado
 */
const getRedirectPath = (subscriptionStatus) => {
  switch (subscriptionStatus) {
    case 'pending_email':
      return '/auth/verify-email';
    case 'pending_subscription':
      return '/pricing';
    case 'active':
      return '/dashboard';
    default:
      return '/auth/login';
  }
};

/**
 * Função para verificar se usuário pode acessar rota
 */
const canAccessRoute = (userProfile, routeRequirements) => {
  if (!userProfile) return false;

  const { requiresEmailVerified, requiresActiveSubscription, requiredPermissions } = routeRequirements;

  // Verificar email verificado
  if (requiresEmailVerified && userProfile.subscription_status === 'pending_email') {
    return false;
  }

  // Verificar assinatura ativa
  if (requiresActiveSubscription && userProfile.subscription_status !== 'active') {
    return false;
  }

  // Verificar permissões específicas
  if (requiredPermissions && requiredPermissions.length > 0) {
    return requiredPermissions.every(permission => hasPermission(userProfile, permission));
  }

  return true;
};

module.exports = {
  // Middlewares básicos
  verifyToken,
  checkUserState,
  authenticate,
  
  // Middlewares por estado
  requireEmailVerified,
  requireActiveSubscription,
  requireUserState,
  
  // Middlewares combinados
  authenticateEmailVerified,
  authenticateActiveSubscription,
  
  // Middlewares especiais
  requireAdmin,
  optionalAuth,
  requirePermission,
  
  // Funções helper
  hasPermission,
  getRedirectPath,
  canAccessRoute
};