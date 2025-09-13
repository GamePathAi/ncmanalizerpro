import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuração do Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 1, // máximo 1 email por minuto
  message: { error: 'Aguarde 1 minuto antes de solicitar outro email.' },
});

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Função para gerar token de verificação
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Função para enviar email de verificação
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  try {
    await resend.emails.send({
      from: 'NCM PRO <noreply@ncmpro.com>',
      to: email,
      subject: 'Confirme seu email - NCM PRO',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirme seu email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">NCM PRO</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Confirme seu email para continuar</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Olá!</h2>
            
            <p>Obrigado por se cadastrar no NCM PRO. Para completar seu cadastro e acessar nossa plataforma, clique no botão abaixo para confirmar seu email:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Confirmar Email</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="color: #667eea; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">Este link expira em 24 horas. Se você não solicitou este email, pode ignorá-lo com segurança.</p>
          </div>
        </body>
        </html>
      `,
    });
    
    console.log(`Email de verificação enviado para: ${email}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
};

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    // Hash da senha
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Gerar token de verificação
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Criar usuário
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        subscription_status: 'pending_email',
        verification_token: verificationToken,
        verification_token_expires: tokenExpiry.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Enviar email de verificação
    const emailSent = await sendVerificationEmail(email, verificationToken);
    
    if (!emailSent) {
      console.error('Falha ao enviar email de verificação');
      // Não falhar o registro por causa do email
    }

    // Log de segurança
    console.log(`Novo usuário registrado: ${email} (ID: ${user.id})`);

    res.status(201).json({
      message: 'Usuário criado com sucesso. Verifique seu email para confirmar.',
      user: {
        id: user.id,
        email: user.email,
        subscription_status: user.subscription_status,
      },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de verificação é obrigatório' });
    }

    // Buscar usuário pelo token
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('verification_token', token)
      .gt('verification_token_expires', new Date().toISOString())
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Atualizar usuário
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified_at: new Date().toISOString(),
        subscription_status: 'pending_subscription',
        verification_token: null,
        verification_token_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao verificar email:', updateError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Log de segurança
    console.log(`Email verificado: ${user.email} (ID: ${user.id})`);

    res.json({ message: 'Email verificado com sucesso!' });
  } catch (error) {
    console.error('Erro na verificação de email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Atualizar último login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Log de segurança
    console.log(`Login bem-sucedido: ${user.email} (ID: ${user.id})`);

    // Configurar cookie httpOnly
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        subscription_status: user.subscription_status,
        email_verified_at: user.email_verified_at,
      },
      token,
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', emailLimiter, authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Verificar se email já foi verificado
    if (user.email_verified_at) {
      return res.status(400).json({ error: 'Email já foi verificado' });
    }

    // Gerar novo token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Atualizar token no banco
    const { error } = await supabase
      .from('users')
      .update({
        verification_token: verificationToken,
        verification_token_expires: tokenExpiry.toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao atualizar token:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Enviar email
    const emailSent = await sendVerificationEmail(user.email, verificationToken);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Erro ao enviar email' });
    }

    console.log(`Email de verificação reenviado: ${user.email}`);

    res.json({ message: 'Email de verificação enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao reenviar verificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        subscription_status: user.subscription_status,
        email_verified_at: user.email_verified_at,
        stripe_customer_id: user.stripe_customer_id,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Logout realizado com sucesso' });
});

// Função para verificar assinatura ativa
const hasActiveSubscription = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return !error && data;
};


export default router;