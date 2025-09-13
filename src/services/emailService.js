import { Resend } from 'resend';
import { emailVerificationTemplate, resendVerificationTemplate } from '../templates/emailVerification.js';
import crypto from 'crypto';

// Configuração do Resend com fallback para a chave fornecida
const resend = new Resend(process.env.RESEND_API_KEY || 're_cUYtKFVN_PKKTwpTDy81aaDFZNWKmwYsz');

// Configurações de email
const EMAIL_CONFIG = {
  from: 'NCM PRO <noreply@ncmpro.com>',
  replyTo: 'suporte@ncmpro.com',
  domain: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Configurações SMTP do Resend
  smtp: {
    host: 'smtp.resend.com',
    port: 465, // TLS
    secure: true,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY || 're_cUYtKFVN_PKKTwpTDy81aaDFZNWKmwYsz'
    }
  }
};

/**
 * Gerar token de verificação seguro
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Gerar link de verificação
 */
const generateVerificationLink = (token) => {
  return `${EMAIL_CONFIG.domain}/verify-email?token=${token}`;
};

/**
 * Enviar email de verificação inicial
 */
const sendVerificationEmail = async (email, userName = null) => {
  try {
    // Gerar token único
    const token = generateVerificationToken();
    const verificationLink = generateVerificationLink(token);
    
    // Preparar nome do usuário
    const displayName = userName || email.split('@')[0];
    
    // Gerar HTML do email
    const htmlContent = emailVerificationTemplate(verificationLink, displayName);
    
    // Enviar email
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Confirme seu email - NCM PRO',
      html: htmlContent,
      text: `
Olá, ${displayName}!

Obrigado por se cadastrar na NCM PRO!

Para completar seu cadastro, confirme seu email clicando no link abaixo:
${verificationLink}

Este link é válido por 24 horas.

Se você não solicitou este cadastro, pode ignorar este email.

Atenciosamente,
Equipe NCM PRO
      `.trim(),
      tags: [
        {
          name: 'category',
          value: 'email_verification'
        },
        {
          name: 'user_email',
          value: email
        }
      ]
    });

    if (error) {
      console.error('Erro do Resend ao enviar email:', error);
      throw new Error(`Falha no envio: ${error.message}`);
    }

    console.log('Email de verificação enviado:', {
      email,
      messageId: data?.id,
      token: token.substring(0, 8) + '...' // Log parcial por segurança
    });

    return {
      success: true,
      token,
      messageId: data?.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    };

  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    return {
      success: false,
      error: error.message || 'Erro interno do servidor de email'
    };
  }
};

/**
 * Reenviar email de verificação
 */
const resendVerificationEmail = async (email, userName = null) => {
  try {
    // Gerar novo token
    const token = generateVerificationToken();
    const verificationLink = generateVerificationLink(token);
    
    // Preparar nome do usuário
    const displayName = userName || email.split('@')[0];
    
    // Gerar HTML do email (template de reenvio)
    const htmlContent = resendVerificationTemplate(verificationLink, displayName);
    
    // Enviar email
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Novo link de verificação - NCM PRO',
      html: htmlContent,
      text: `
Olá, ${displayName}!

Você solicitou um novo link de verificação para sua conta na NCM PRO.

Clique no link abaixo para confirmar seu email:
${verificationLink}

Este novo link substitui qualquer link anterior.
Válido por 24 horas.

Atenciosamente,
Equipe NCM PRO
      `.trim(),
      tags: [
        {
          name: 'category',
          value: 'email_verification_resend'
        },
        {
          name: 'user_email',
          value: email
        }
      ]
    });

    if (error) {
      console.error('Erro do Resend ao reenviar email:', error);
      throw new Error(`Falha no reenvio: ${error.message}`);
    }

    console.log('Email de verificação reenviado:', {
      email,
      messageId: data?.id,
      token: token.substring(0, 8) + '...'
    });

    return {
      success: true,
      token,
      messageId: data?.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

  } catch (error) {
    console.error('Erro ao reenviar email de verificação:', error);
    return {
      success: false,
      error: error.message || 'Erro interno do servidor de email'
    };
  }
};

/**
 * Enviar email de boas-vindas após verificação
 */
const sendWelcomeEmail = async (email, userName = null) => {
  try {
    const displayName = userName || email.split('@')[0];
    
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Bem-vindo à NCM PRO! 🎉',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bem-vindo à NCM PRO</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Bem-vindo à NCM PRO!</h1>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #667eea;">Olá, ${displayName}!</h2>
        
        <p>Parabéns! Seu email foi verificado com sucesso e sua conta na NCM PRO está ativa.</p>
        
        <p><strong>Próximos passos:</strong></p>
        <ol>
            <li>Escolha um plano que atenda suas necessidades</li>
            <li>Complete seu perfil</li>
            <li>Comece a usar nossas ferramentas</li>
        </ol>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${EMAIL_CONFIG.domain}/pricing" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Planos</a>
        </div>
        
        <p>Se tiver dúvidas, nossa equipe está aqui para ajudar!</p>
        
        <p>Atenciosamente,<br><strong>Equipe NCM PRO</strong></p>
    </div>
</body>
</html>
      `,
      text: `
Olá, ${displayName}!

Parabéns! Seu email foi verificado com sucesso e sua conta na NCM PRO está ativa.

Próximos passos:
1. Escolha um plano que atenda suas necessidades
2. Complete seu perfil  
3. Comece a usar nossas ferramentas

Acesse: ${EMAIL_CONFIG.domain}/pricing

Atenciosamente,
Equipe NCM PRO
      `,
      tags: [
        {
          name: 'category',
          value: 'welcome'
        }
      ]
    });

    if (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      return { success: false, error: error.message };
    }

    console.log('Email de boas-vindas enviado:', { email, messageId: data?.id });
    return { success: true, messageId: data?.id };

  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validar configuração do serviço de email
 */
const validateEmailConfig = () => {
  const requiredEnvVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  }

  return true;
};

/**
 * Testar conectividade com Resend
 */
const testEmailService = async () => {
  try {
    validateEmailConfig();
    
    // Teste simples - listar domínios (não envia email)
    const { data, error } = await resend.domains.list();
    
    if (error) {
      throw new Error(`Erro na API Resend: ${error.message}`);
    }
    
    return {
      success: true,
      message: 'Serviço de email configurado corretamente',
      domains: data?.data?.length || 0
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enviar email de confirmação de assinatura
 */
const sendSubscriptionConfirmationEmail = async (email, userName = null, planName = 'Premium') => {
  try {
    const displayName = userName || email.split('@')[0];
    
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: '🎉 Sua assinatura foi ativada - NCM PRO',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Assinatura Ativada</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Assinatura Ativada!</h1>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #10b981;">Olá, ${displayName}!</h2>
        
        <p>Parabéns! Sua assinatura do plano <strong>${planName}</strong> foi ativada com sucesso.</p>
        
        <p><strong>Agora você tem acesso completo a:</strong></p>
        <ul style="color: #4a5568; margin: 20px 0; padding-left: 20px;">
            <li>Dashboard completo com métricas avançadas</li>
            <li>Relatórios detalhados e exportação de dados</li>
            <li>Suporte prioritário via chat e email</li>
            <li>Integrações com sistemas externos</li>
            <li>Backup automático dos seus dados</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${EMAIL_CONFIG.domain}/dashboard" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Acessar Dashboard</a>
        </div>
        
        <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #0369a1; margin: 0;"><strong>💡 Dica:</strong> Explore todas as funcionalidades disponíveis no seu dashboard. Se precisar de ajuda, nossa equipe de suporte está sempre disponível!</p>
        </div>
        
        <p>Atenciosamente,<br><strong>Equipe NCM PRO</strong></p>
    </div>
</body>
</html>
      `,
      text: `
Olá, ${displayName}!

Parabéns! Sua assinatura do plano ${planName} foi ativada com sucesso.

Agora você tem acesso completo a:
- Dashboard completo com métricas avançadas
- Relatórios detalhados e exportação de dados
- Suporte prioritário via chat e email
- Integrações com sistemas externos
- Backup automático dos seus dados

Acesse seu dashboard: ${EMAIL_CONFIG.domain}/dashboard

Atenciosamente,
Equipe NCM PRO
      `,
      tags: [
        {
          name: 'category',
          value: 'subscription_confirmation'
        },
        {
          name: 'plan_name',
          value: planName
        }
      ]
    });

    if (error) {
      console.error('Erro ao enviar email de confirmação de assinatura:', error);
      return { success: false, error: error.message };
    }

    console.log('Email de confirmação de assinatura enviado:', { email, messageId: data?.id, planName });
    return { success: true, messageId: data?.id };

  } catch (error) {
    console.error('Erro ao enviar email de confirmação de assinatura:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enviar email de cancelamento de assinatura
 */
const sendSubscriptionCancelledEmail = async (email, userName = null) => {
  try {
    const displayName = userName || email.split('@')[0];
    
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Assinatura cancelada - NCM PRO',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Assinatura Cancelada</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Assinatura Cancelada</h1>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #f59e0b;">Olá, ${displayName}!</h2>
        
        <p>Sua assinatura do NCM PRO foi cancelada conforme solicitado.</p>
        
        <p><strong>Você ainda pode:</strong></p>
        <ul style="color: #4a5568; margin: 20px 0; padding-left: 20px;">
            <li>Acessar sua conta até o final do período pago</li>
            <li>Fazer download dos seus dados</li>
            <li>Reativar sua assinatura a qualquer momento</li>
        </ul>
        
        <p>Sentiremos sua falta! Se mudou de ideia, você pode reativar sua assinatura facilmente:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${EMAIL_CONFIG.domain}/pricing" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reativar Assinatura</a>
        </div>
        
        <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #0369a1; margin: 0;"><strong>💬 Feedback:</strong> Adoraríamos saber o motivo do cancelamento para melhorar nossos serviços. Responda este email com seus comentários!</p>
        </div>
        
        <p>Atenciosamente,<br><strong>Equipe NCM PRO</strong></p>
    </div>
</body>
</html>
      `,
      text: `
Olá, ${displayName}!

Sua assinatura do NCM PRO foi cancelada conforme solicitado.

Você ainda pode:
- Acessar sua conta até o final do período pago
- Fazer download dos seus dados
- Reativar sua assinatura a qualquer momento

Para reativar: ${EMAIL_CONFIG.domain}/pricing

Atenciosamente,
Equipe NCM PRO
      `,
      tags: [
        {
          name: 'category',
          value: 'subscription_cancelled'
        }
      ]
    });

    if (error) {
      console.error('Erro ao enviar email de cancelamento:', error);
      return { success: false, error: error.message };
    }

    console.log('Email de cancelamento enviado:', { email, messageId: data?.id });
    return { success: true, messageId: data?.id };

  } catch (error) {
    console.error('Erro ao enviar email de cancelamento:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enviar email de recuperação de senha
 */
const sendPasswordResetEmail = async (email, userName = null, resetToken) => {
  try {
    const displayName = userName || email.split('@')[0];
    const resetUrl = `${EMAIL_CONFIG.domain}/reset-password?token=${resetToken}`;
    
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Redefinir senha - NCM PRO',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Redefinir Senha</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🔒 Redefinir Senha</h1>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #dc2626;">Olá, ${displayName}!</h2>
        
        <p>Recebemos uma solicitação para redefinir a senha da sua conta NCM PRO.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Redefinir Senha</a>
        </div>
        
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; background-color: #f7fafc; padding: 10px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #dc2626; margin: 0;"><strong>🔒 Segurança:</strong> Este link é válido por 24 horas. Se você não solicitou a redefinição de senha, ignore este email e sua senha permanecerá inalterada.</p>
        </div>
        
        <p>Atenciosamente,<br><strong>Equipe NCM PRO</strong></p>
    </div>
</body>
</html>
      `,
      text: `
Olá, ${displayName}!

Recebemos uma solicitação para redefinir a senha da sua conta NCM PRO.

Clique no link abaixo para redefinir sua senha:
${resetUrl}

Este link é válido por 24 horas.

Se você não solicitou a redefinição de senha, ignore este email.

Atenciosamente,
Equipe NCM PRO
      `,
      tags: [
        {
          name: 'category',
          value: 'password_reset'
        }
      ]
    });

    if (error) {
      console.error('Erro ao enviar email de reset de senha:', error);
      return { success: false, error: error.message };
    }

    console.log('Email de reset de senha enviado:', { email, messageId: data?.id });
    return { success: true, messageId: data?.id };

  } catch (error) {
    console.error('Erro ao enviar email de reset de senha:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Rate limiting para envio de emails
 */
const emailRateLimit = new Map();

const checkEmailRateLimit = (email, maxEmails = 5, windowMs = 60000) => {
  const now = Date.now();
  const userKey = email.toLowerCase();
  
  if (!emailRateLimit.has(userKey)) {
    emailRateLimit.set(userKey, []);
  }
  
  const userRequests = emailRateLimit.get(userKey);
  
  // Remove requests antigas
  const validRequests = userRequests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxEmails) {
    throw new Error('Muitos emails enviados. Tente novamente em alguns minutos.');
  }
  
  validRequests.push(now);
  emailRateLimit.set(userKey, validRequests);
  
  return true;
};

export {
  sendVerificationEmail,
  resendVerificationEmail,
  sendWelcomeEmail,
  sendSubscriptionConfirmationEmail,
  sendSubscriptionCancelledEmail,
  sendPasswordResetEmail,
  generateVerificationToken,
  generateVerificationLink,
  validateEmailConfig,
  testEmailService,
  checkEmailRateLimit
};