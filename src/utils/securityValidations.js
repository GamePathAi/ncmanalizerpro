import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting configuration
const RATE_LIMITS = {
  email_verification: { max: 3, window: 3600 }, // 3 per hour
  login_attempts: { max: 5, window: 900 },      // 5 per 15 min
  registration: { max: 2, window: 1800 }        // 2 per 30 min
};

export class SecurityValidations {
  // Check if email is unique
  static async isEmailUnique(email) {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('Error checking email uniqueness:', error);
        return false;
      }

      const existingUser = data.users.find(user => user.email === email);
      return !existingUser;
    } catch (error) {
      console.error('Error in isEmailUnique:', error);
      return false;
    }
  }

  // Generate secure token
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Advanced rate limiting
  static async checkRateLimit(identifier, action, ip = null) {
    try {
      const limit = RATE_LIMITS[action];
      if (!limit) return { allowed: true, remaining: Infinity };

      const windowStart = new Date(Date.now() - limit.window * 1000);
      
      // Check existing attempts
      const { data, error } = await supabase
        .from('rate_limit_logs')
        .select('*')
        .eq('identifier', identifier)
        .eq('action', action)
        .gte('created_at', windowStart.toISOString());

      if (error) {
        console.error('Rate limit check error:', error);
        return { allowed: true, remaining: limit.max };
      }

      const attempts = data?.length || 0;
      const remaining = Math.max(0, limit.max - attempts);
      const allowed = attempts < limit.max;

      // Log this attempt if allowed
      if (allowed) {
        await supabase
          .from('rate_limit_logs')
          .insert({
            identifier,
            action,
            ip_address: ip,
            created_at: new Date().toISOString()
          });
      }

      return { allowed, remaining, resetTime: windowStart.getTime() + limit.window * 1000 };
    } catch (error) {
      console.error('Rate limiting error:', error);
      return { allowed: true, remaining: 1 };
    }
  }

  // Validate password strength
  static validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  static calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    // Complexity patterns
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) score += 1;
    
    if (score <= 2) return 'weak';
    if (score <= 5) return 'medium';
    return 'strong';
  }
}

// Security logging function
export async function logSecurityEvent(event, details = {}) {
  try {
    await supabase
      .from('security_logs')
      .insert({
        event_type: event,
        details: JSON.stringify(details),
        ip_address: details.ip || null,
        user_agent: details.userAgent || null,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Security logging error:', error);
  }
}

// Detect suspicious activity
export async function detectSuspiciousActivity(identifier, action, ip) {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Check for rapid repeated attempts
    const { data: recentAttempts } = await supabase
      .from('rate_limit_logs')
      .select('*')
      .eq('identifier', identifier)
      .gte('created_at', last24h.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentAttempts && recentAttempts.length >= 8) {
      await logSecurityEvent('suspicious_activity_detected', {
        identifier,
        action,
        ip,
        reason: 'rapid_repeated_attempts',
        attemptCount: recentAttempts.length
      });
      
      return {
        isSuspicious: true,
        reason: 'Too many attempts in 24h',
        shouldBlock: true
      };
    }

    // Check for multiple IPs for same identifier
    if (recentAttempts && recentAttempts.length > 0) {
      const uniqueIPs = new Set(recentAttempts.map(attempt => attempt.ip_address).filter(Boolean));
      
      if (uniqueIPs.size >= 3) {
        await logSecurityEvent('suspicious_activity_detected', {
          identifier,
          action,
          ip,
          reason: 'multiple_ips',
          ipCount: uniqueIPs.size
        });
        
        return {
          isSuspicious: true,
          reason: 'Multiple IPs detected',
          shouldBlock: false
        };
      }
    }

    return {
      isSuspicious: false,
      reason: null,
      shouldBlock: false
    };
  } catch (error) {
    console.error('Suspicious activity detection error:', error);
    return {
      isSuspicious: false,
      reason: 'Detection error',
      shouldBlock: false
    };
  }
}

// Block IP address
export async function blockIP(ip, reason, duration = 3600) {
  try {
    const expiresAt = new Date(Date.now() + duration * 1000);
    
    await supabase
      .from('blocked_ips')
      .insert({
        ip_address: ip,
        reason,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    await logSecurityEvent('ip_blocked', {
      ip,
      reason,
      duration
    });

    return true;
  } catch (error) {
    console.error('IP blocking error:', error);
    return false;
  }
}

// Check if IP is blocked
export async function isIPBlocked(ip) {
  try {
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('*')
      .eq('ip_address', ip)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (error) {
      console.error('IP block check error:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('IP block check error:', error);
    return false;
  }
}

export default SecurityValidations;