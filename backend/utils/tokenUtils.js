/**
 * Utilitários para geração e validação de tokens seguros
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Gera um token JWT seguro para verificação de email
 */
const generateEmailVerificationToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'email_verification',
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex')
  };
  
  const options = {
    expiresIn: '24h',
    issuer: 'ncm-analyzer-pro',
    audience: 'email-verification'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Gera um token JWT seguro para redefinição de senha
 */
const generatePasswordResetToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'password_reset',
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex')
  };
  
  const options = {
    expiresIn: '1h',
    issuer: 'ncm-analyzer-pro',
    audience: 'password-reset'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Valida um token JWT e retorna os dados decodificados
 */
const validateToken = (token, expectedType, expectedAudience) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'ncm-analyzer-pro',
      audience: expectedAudience
    });
    
    // Verificar se o tipo do token está correto
    if (decoded.type !== expectedType) {
      throw new Error('Tipo de token inválido');
    }
    
    // Verificar se o token não é muito antigo (proteção adicional)
    const tokenAge = Date.now() - decoded.timestamp;
    const maxAge = expectedType === 'email_verification' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    
    if (tokenAge > maxAge) {
      throw new Error('Token expirado');
    }
    
    return {
      valid: true,
      data: decoded
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * Valida especificamente um token de verificação de email
 */
const validateEmailVerificationToken = (token) => {
  return validateToken(token, 'email_verification', 'email-verification');
};

/**
 * Valida especificamente um token de redefinição de senha
 */
const validatePasswordResetToken = (token) => {
  return validateToken(token, 'password_reset', 'password-reset');
};

/**
 * Gera um código de verificação numérico de 6 dígitos
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Armazena um token de verificação no banco de dados com expiração
 */
const storeVerificationToken = async (userId, token, type, expiresAt) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('verification_tokens')
      .insert({
        user_id: userId,
        token_hash: crypto.createHash('sha256').update(token).digest('hex'),
        token_type: type,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        used: false
      });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao armazenar token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verifica se um token existe no banco e não foi usado
 */
const verifyStoredToken = async (token, type) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const { data, error } = await supabaseAdmin
      .from('verification_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('token_type', type)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) {
      return { valid: false, error: 'Token inválido ou expirado' };
    }
    
    return { valid: true, data };
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return { valid: false, error: error.message };
  }
};

/**
 * Marca um token como usado
 */
const markTokenAsUsed = async (tokenId) => {
  try {
    const { error } = await supabaseAdmin
      .from('verification_tokens')
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('id', tokenId);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar token como usado:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove tokens expirados do banco de dados
 */
const cleanupExpiredTokens = async () => {
  try {
    const { error } = await supabaseAdmin
      .from('verification_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    if (error) {
      throw error;
    }
    
    console.log('Tokens expirados removidos com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro ao limpar tokens expirados:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Invalida todos os tokens de um usuário específico
 */
const invalidateUserTokens = async (userId, tokenType = null) => {
  try {
    let query = supabaseAdmin
      .from('verification_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('used', false);
    
    if (tokenType) {
      query = query.eq('token_type', tokenType);
    }
    
    const { error } = await query;
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao invalidar tokens do usuário:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gera um token de acesso JWT para autenticação
 */
const generateAccessToken = (userId, email, subscriptionStatus) => {
  const payload = {
    userId,
    email,
    subscriptionStatus,
    type: 'access_token',
    timestamp: Date.now()
  };
  
  const options = {
    expiresIn: '7d',
    issuer: 'ncm-analyzer-pro',
    audience: 'api-access'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Gera um refresh token para renovação de acesso
 */
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh_token',
    timestamp: Date.now(),
    nonce: crypto.randomBytes(32).toString('hex')
  };
  
  const options = {
    expiresIn: '30d',
    issuer: 'ncm-analyzer-pro',
    audience: 'token-refresh'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Valida um token de acesso
 */
const validateAccessToken = (token) => {
  return validateToken(token, 'access_token', 'api-access');
};

/**
 * Valida um refresh token
 */
const validateRefreshToken = (token) => {
  return validateToken(token, 'refresh_token', 'token-refresh');
};

/**
 * Cria um hash seguro para senhas
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Verifica uma senha contra seu hash
 */
const verifyPassword = (password, hashedPassword) => {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

module.exports = {
  generateEmailVerificationToken,
  generatePasswordResetToken,
  validateEmailVerificationToken,
  validatePasswordResetToken,
  generateVerificationCode,
  storeVerificationToken,
  verifyStoredToken,
  markTokenAsUsed,
  cleanupExpiredTokens,
  invalidateUserTokens,
  generateAccessToken,
  generateRefreshToken,
  validateAccessToken,
  validateRefreshToken,
  hashPassword,
  verifyPassword
};