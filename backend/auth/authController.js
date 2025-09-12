const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');
const { emailVerificationTemplate, passwordResetTemplate, welcomeTemplate } = require('../templates/emailTemplates');
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Configurações do Supabase não encontradas');
}

// Cliente admin (service role)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente público (anon key)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Rate limiting para endpoints sensíveis
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const emailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // máximo 3 emails por IP
  message: {
    error: 'Muitos emails enviados. Tente novamente em 5 minutos.',
    code: 'EMAIL_RATE_LIMIT_EXCEEDED'
  }
});

// Função para gerar token seguro
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Função para log de eventos de autenticação
async function logAuthEvent(userId, eventType, success = true, metadata = {}, req = null) {
  try {
    const logData = {
      user_id: userId,
      event_type: eventType,
      success,
      metadata,
      ip_address: req?.ip || req?.connection?.remoteAddress,
      user_agent: req?.get('User-Agent')
    };

    if (!success && metadata.error) {
      logData.error_message = metadata.error;
    }

    await supabaseAdmin
      .from('auth_logs')
      .insert(logData);
  } catch (error) {
    console.error('Erro ao registrar log de autenticação:', error);
  }
}

// Função para enviar email de verificação
async function sendVerificationEmail(userId, email, token, userName = 'Usuário') {
  try {
    const verificationUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;
    
    // Para desenvolvimento, usar email do desenvolvedor se não for o email autorizado
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const authorizedEmail = 'gamepathai@gmail.com';
    const recipientEmail = isDevelopment && email !== authorizedEmail ? authorizedEmail : email;
    
    // Gerar HTML do template
    const htmlContent = emailVerificationTemplate({
      userName,
      verificationUrl,
      expirationHours: 24
    });
    
    const { data, error } = await resend.emails.send({
      from: isDevelopment ? 
        '"NCM Analyzer Pro" <onboarding@resend.dev>' : 
        '"NCM Analyzer Pro" <noreply@ncmanalyzerpro.com>',
      to: [recipientEmail],
      subject: 'Confirme seu email - NCM Analyzer Pro',
      html: htmlContent
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email de verificação');
    }
    
    return { 
      success: true, 
      messageId: data?.id,
      sentTo: recipientEmail,
      isDevelopment
    };
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// CONTROLLERS
// =====================================================

// Registro de usuário
const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validações
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Senha deve ter pelo menos 8 caracteres',
        code: 'WEAK_PASSWORD'
      });
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, subscription_status')
      .eq('email', email)
      .single();

    if (existingUser) {
      await logAuthEvent(null, 'register', false, {
        error: 'Email já cadastrado',
        email
      }, req);

      return res.status(409).json({
        error: 'Este email já está cadastrado',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Não confirmar automaticamente
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      await logAuthEvent(null, 'register', false, {
        error: authError.message,
        email
      }, req);

      return res.status(400).json({
        error: 'Erro ao criar usuário',
        details: authError.message,
        code: 'AUTH_ERROR'
      });
    }

    const userId = authData.user.id;

    // Atualizar perfil com nome completo
    if (fullName) {
      await supabaseAdmin
        .from('user_profiles')
        .update({ full_name: fullName })
        .eq('id', userId);
    }

    // Gerar token de verificação
    const verificationToken = generateSecureToken();
    
    await supabaseAdmin
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        token: verificationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      });

    // Enviar email de verificação
    const emailResult = await sendVerificationEmail(userId, email, verificationToken, fullName);
    
    if (!emailResult.success) {
      console.error('Falha ao enviar email de verificação:', emailResult.error);
      // Não falhar o registro por causa do email
    }

    await logAuthEvent(userId, 'register', true, {
      email,
      full_name: fullName,
      email_sent: emailResult.success
    }, req);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso. Verifique seu email para ativar a conta.',
      user: {
        id: userId,
        email,
        subscription_status: 'pending_email'
      },
      email_sent: emailResult.success
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    
    await logAuthEvent(null, 'register', false, {
      error: error.message,
      email: req.body.email
    }, req);

    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Verificação de email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token de verificação é obrigatório',
        code: 'MISSING_TOKEN'
      });
    }

    // Verificar email usando função do banco
    const { data, error } = await supabaseAdmin
      .rpc('verify_user_email', { verification_token: token });

    if (error) {
      return res.status(500).json({
        error: 'Erro ao verificar email',
        details: error.message,
        code: 'VERIFICATION_ERROR'
      });
    }

    const result = data;

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        code: 'INVALID_TOKEN'
      });
    }

    await logAuthEvent(result.user_id, 'verify_email', true, {
      token_used: token
    }, req);

    res.json({
      success: true,
      message: 'Email verificado com sucesso! Agora você pode fazer login.',
      user: {
        id: result.user_id,
        subscription_status: result.subscription_status
      }
    });

  } catch (error) {
    console.error('Erro na verificação de email:', error);
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    // Fazer login no Supabase
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      await logAuthEvent(null, 'login', false, {
        error: authError.message,
        email
      }, req);

      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const userId = authData.user.id;

    // Buscar perfil do usuário
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      await logAuthEvent(userId, 'login', false, {
        error: 'Perfil não encontrado'
      }, req);

      return res.status(404).json({
        error: 'Perfil de usuário não encontrado',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Verificar se email foi confirmado
    if (userProfile.subscription_status === 'pending_email') {
      await logAuthEvent(userId, 'login', false, {
        error: 'Email não verificado',
        subscription_status: userProfile.subscription_status
      }, req);

      return res.status(403).json({
        error: 'Email não verificado. Verifique sua caixa de entrada.',
        code: 'EMAIL_NOT_VERIFIED',
        subscription_status: 'pending_email'
      });
    }

    // Atualizar último login
    await supabaseAdmin
      .from('user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    await logAuthEvent(userId, 'login', true, {
      subscription_status: userProfile.subscription_status
    }, req);

    // Retornar dados do usuário e token
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        subscription_status: userProfile.subscription_status,
        subscription_plan: userProfile.subscription_plan,
        subscription_expires_at: userProfile.subscription_expires_at
      },
      session: authData.session
    });

  } catch (error) {
    console.error('Erro no login:', error);
    
    await logAuthEvent(null, 'login', false, {
      error: error.message,
      email: req.body.email
    }, req);

    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Reenviar email de verificação
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório',
        code: 'MISSING_EMAIL'
      });
    }

    // Buscar usuário
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar se já está verificado
    if (userProfile.subscription_status !== 'pending_email') {
      return res.status(400).json({
        error: 'Email já foi verificado',
        code: 'EMAIL_ALREADY_VERIFIED'
      });
    }

    // Invalidar tokens anteriores
    await supabaseAdmin
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', userProfile.id)
      .is('used_at', null);

    // Gerar novo token
    const verificationToken = generateSecureToken();
    
    await supabaseAdmin
      .from('email_verification_tokens')
      .insert({
        user_id: userProfile.id,
        token: verificationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      });

    // Enviar email
    const emailResult = await sendVerificationEmail(userProfile.id, email, verificationToken, userProfile.full_name);
    
    await logAuthEvent(userProfile.id, 'resend_verification', emailResult.success, {
      email,
      email_sent: emailResult.success
    }, req);

    if (!emailResult.success) {
      return res.status(500).json({
        error: 'Erro ao enviar email de verificação',
        details: emailResult.error,
        code: 'EMAIL_SEND_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Email de verificação reenviado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao reenviar verificação:', error);
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obter estado do usuário atual
const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Buscar estado do usuário usando função do banco
    const { data, error } = await supabaseAdmin
      .rpc('get_user_state', { user_id_param: userId });

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar dados do usuário',
        details: error.message,
        code: 'USER_FETCH_ERROR'
      });
    }

    const result = data;

    if (!result.success) {
      return res.status(404).json({
        error: result.error,
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user: result.user
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      await logAuthEvent(userId, 'logout', true, {}, req);
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no logout:', error);
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  register: [authLimiter, register],
  verifyEmail,
  login: [authLimiter, login],
  resendVerification: [emailLimiter, resendVerification],
  getMe,
  logout,
  // Middlewares exportados
  authLimiter,
  emailLimiter
};