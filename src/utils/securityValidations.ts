import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuração do cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Validações de Segurança para Sistema de Autenticação
 */

// ============================================================================
// 1. VALIDAÇÃO DE EMAIL ÚNICO
// ============================================================================

/**
 * Verifica se o email já está em uso no sistema
 * @param email - Email a ser verificado
 * @returns Promise<boolean> - true se email está disponível, false se já existe
 */
export async function validateUniqueEmail(email: string): Promise<{
  isUnique: boolean;
  error?: string;
}> {
  try {
    // Normalizar email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return {
        isUnique: false,
        error: 'Formato de email inválido'
      };
    }
    
    // Verificar se email já existe na tabela auth.users
    const { data: existingUser, error } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', normalizedEmail)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erro ao verificar email único:', error);
      return {
        isUnique: false,
        error: 'Erro interno ao verificar email'
      };
    }
    
    // Se encontrou usuário, email não é único
    if (existingUser) {
      return {
        isUnique: false,
        error: 'Este email já está cadastrado no sistema'
      };
    }
    
    return { isUnique: true };
    
  } catch (error) {
    console.error('Erro na validação de email único:', error);
    return {
      isUnique: false,
      error: 'Erro interno na validação'
    };
  }
}

// ============================================================================
// 2. GERAÇÃO DE TOKENS SEGUROS
// ============================================================================

/**
 * Gera token seguro para verificação de email
 * @param length - Comprimento do token (padrão: 32 bytes = 64 chars hex)
 * @returns string - Token hexadecimal seguro
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Gera token com expiração para verificação de email
 * @param expirationHours - Horas até expiração (padrão: 24h)
 * @returns Objeto com token e data de expiração
 */
export function generateTokenWithExpiration(expirationHours: number = 24): {
  token: string;
  expiresAt: Date;
  expiresAtISO: string;
} {
  const token = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expirationHours);
  
  return {
    token,
    expiresAt,
    expiresAtISO: expiresAt.toISOString()
  };
}

/**
 * Valida se token não expirou
 * @param expirationDate - Data de expiração do token
 * @returns boolean - true se token ainda é válido
 */
export function validateTokenExpiration(expirationDate: string | Date): boolean {
  const expiration = typeof expirationDate === 'string' 
    ? new Date(expirationDate) 
    : expirationDate;
  
  return expiration > new Date();
}

// ============================================================================
// 3. RATE LIMITING AVANÇADO
// ============================================================================

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: Date;
  error?: string;
}

/**
 * Sistema de rate limiting para diferentes ações
 */
export class RateLimiter {
  private static readonly configs: Record<string, RateLimitConfig> = {
    // Email de verificação: 3 tentativas por hora
    'email_verification': {
      maxAttempts: 3,
      windowMinutes: 60,
      blockDurationMinutes: 60
    },
    // Login: 5 tentativas por 15 minutos
    'login_attempts': {
      maxAttempts: 5,
      windowMinutes: 15,
      blockDurationMinutes: 30
    },
    // Cadastro: 3 tentativas por 10 minutos
    'signup_attempts': {
      maxAttempts: 3,
      windowMinutes: 10,
      blockDurationMinutes: 20
    },
    // Reset de senha: 2 tentativas por hora
    'password_reset': {
      maxAttempts: 2,
      windowMinutes: 60,
      blockDurationMinutes: 120
    }
  };

  /**
   * Verifica se ação é permitida baseada no rate limit
   * @param action - Tipo de ação (email_verification, login_attempts, etc.)
   * @param identifier - Identificador único (email, IP, user_id)
   * @returns Promise<RateLimitResult>
   */
  static async checkRateLimit(
    action: string,
    identifier: string
  ): Promise<RateLimitResult> {
    try {
      const config = this.configs[action];
      if (!config) {
        return {
          allowed: true,
          remainingAttempts: 999,
          resetTime: new Date(Date.now() + 60000) // 1 minuto
        };
      }

      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

      // Buscar tentativas recentes
      const { data: recentAttempts, error } = await supabase
        .from('rate_limit_logs')
        .select('*')
        .eq('action', action)
        .eq('identifier', identifier)
        .gte('created_at', windowStart.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao verificar rate limit:', error);
        // Em caso de erro, permitir (fail-open)
        return {
          allowed: true,
          remainingAttempts: config.maxAttempts,
          resetTime: new Date(Date.now() + config.windowMinutes * 60000)
        };
      }

      const attemptCount = recentAttempts?.length || 0;
      const remainingAttempts = Math.max(0, config.maxAttempts - attemptCount);
      
      // Calcular quando o rate limit reseta
      const resetTime = new Date();
      resetTime.setMinutes(resetTime.getMinutes() + config.windowMinutes);

      if (attemptCount >= config.maxAttempts) {
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime,
          error: `Muitas tentativas. Tente novamente em ${config.windowMinutes} minutos.`
        };
      }

      return {
        allowed: true,
        remainingAttempts,
        resetTime
      };

    } catch (error) {
      console.error('Erro no rate limiter:', error);
      // Em caso de erro, permitir (fail-open)
      return {
        allowed: true,
        remainingAttempts: 1,
        resetTime: new Date(Date.now() + 60000)
      };
    }
  }

  /**
   * Registra uma tentativa no log de rate limiting
   * @param action - Tipo de ação
   * @param identifier - Identificador único
   * @param success - Se a tentativa foi bem-sucedida
   * @param metadata - Dados adicionais (opcional)
   */
  static async logAttempt(
    action: string,
    identifier: string,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase
        .from('rate_limit_logs')
        .insert({
          action,
          identifier,
          success,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao registrar tentativa:', error);
      // Não falhar se não conseguir logar
    }
  }
}

// ============================================================================
// 4. VALIDAÇÕES DE SENHA SEGURA
// ============================================================================

interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Valida força da senha
 * @param password - Senha a ser validada
 * @returns PasswordValidationResult
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Verificações básicas
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  } else {
    score += 1;
  }

  // Verificar senhas comuns
  const commonPasswords = [
    '123456', 'password', '123456789', '12345678', '12345',
    '1234567', '1234567890', 'qwerty', 'abc123', 'password123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Senha muito comum. Escolha uma senha mais segura');
    score = 0;
  }

  // Determinar força
  let strength: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

// ============================================================================
// 5. LOGS DE SEGURANÇA
// ============================================================================

interface SecurityLogEntry {
  event_type: string;
  user_id?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  details?: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high';
}

/**
 * Registra eventos de segurança
 * @param entry - Dados do evento de segurança
 */
export async function logSecurityEvent(entry: SecurityLogEntry): Promise<void> {
  try {
    await supabase
      .from('security_logs')
      .insert({
        ...entry,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Erro ao registrar evento de segurança:', error);
    // Não falhar se não conseguir logar
  }
}

// ============================================================================
// 6. UTILITÁRIOS DE VALIDAÇÃO
// ============================================================================

/**
 * Sanitiza entrada de usuário
 * @param input - String a ser sanitizada
 * @returns String sanitizada
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove caracteres perigosos
    .substring(0, 255); // Limita tamanho
}

/**
 * Valida se IP está em lista de bloqueio
 * @param ipAddress - Endereço IP
 * @returns boolean - true se IP está bloqueado
 */
export async function isIPBlocked(ipAddress: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('ip_address')
      .eq('ip_address', ipAddress)
      .eq('is_active', true)
      .single();

    return !error && !!data;
  } catch {
    return false; // Em caso de erro, não bloquear
  }
}

/**
 * Detecta tentativas suspeitas baseadas em padrões
 * @param email - Email do usuário
 * @param ipAddress - IP do usuário
 * @returns boolean - true se atividade é suspeita
 */
export async function detectSuspiciousActivity(
  email: string,
  ipAddress: string
): Promise<{
  isSuspicious: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];
  
  try {
    // Verificar múltiplas tentativas de diferentes IPs
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const { data: recentAttempts } = await supabase
      .from('security_logs')
      .select('ip_address')
      .eq('email', email)
      .gte('created_at', oneHourAgo.toISOString());
    
    if (recentAttempts && recentAttempts.length > 0) {
      const uniqueIPs = new Set(recentAttempts.map(a => a.ip_address));
      if (uniqueIPs.size > 3) {
        reasons.push('Múltiplos IPs em pouco tempo');
      }
    }
    
    // Verificar se IP está em lista de bloqueio
    if (await isIPBlocked(ipAddress)) {
      reasons.push('IP bloqueado');
    }
    
    return {
      isSuspicious: reasons.length > 0,
      reasons
    };
    
  } catch (error) {
    console.error('Erro na detecção de atividade suspeita:', error);
    return {
      isSuspicious: false,
      reasons: []
    };
  }
}

export default {
  validateUniqueEmail,
  generateSecureToken,
  generateTokenWithExpiration,
  validateTokenExpiration,
  RateLimiter,
  validatePasswordStrength,
  logSecurityEvent,
  sanitizeInput,
  isIPBlocked,
  detectSuspiciousActivity
};