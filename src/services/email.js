import { Resend } from 'resend';
import { createTransport } from 'nodemailer';

// Configurar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Configurar Nodemailer com SMTP do Resend (fallback)
const transporter = createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY
  }
});

/**
 * Template HTML para email de verificação
 */
const getVerificationEmailTemplate = (verificationUrl, email) => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirme seu email - NCM PRO</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .content {
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background: #1d4ed8;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .title {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">NCM PRO</div>
            <h1 class="title">Confirme seu email</h1>
            <p class="subtitle">Estamos quase lá! Confirme seu email para continuar.</p>
        </div>
        
        <div class="content">
            <p>Olá,</p>
            <p>Obrigado por se cadastrar no <strong>NCM PRO</strong>! Para completar seu cadastro e acessar nossa plataforma, você precisa confirmar seu endereço de email.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">Confirmar Email</a>
            </div>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">
                ${verificationUrl}
            </p>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Este link expira em 24 horas. Se você não confirmar seu email dentro deste prazo, será necessário solicitar um novo link de confirmação.
            </div>
        </div>
        
        <div class="footer">
            <p>Se você não se cadastrou no NCM PRO, pode ignorar este email com segurança.</p>
            <p>Este email foi enviado para <strong>${email}</strong></p>
            <p>© 2024 NCM PRO. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
  `;
};

/**
 * Template HTML para email de reset de senha
 */
const getPasswordResetTemplate = (resetUrl, email) => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir senha - NCM PRO</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .content {
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background: #b91c1c;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .warning {
            background: #fef2f2;
            border: 1px solid #f87171;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .title {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔒 NCM PRO</div>
            <h1 class="title">Redefinir senha</h1>
            <p class="subtitle">Recebemos uma solicitação para redefinir sua senha.</p>
        </div>
        
        <div class="content">
            <p>Olá,</p>
            <p>Você solicitou a redefinição da sua senha no <strong>NCM PRO</strong>. Clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </div>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">
                ${resetUrl}
            </p>
            
            <div class="warning">
                <strong>🔒 Segurança:</strong> Este link expira em 1 hora. Se você não solicitou esta redefinição, pode ignorar este email com segurança.
            </div>
        </div>
        
        <div class="footer">
            <p>Se você não solicitou a redefinição de senha, entre em contato conosco imediatamente.</p>
            <p>Este email foi enviado para <strong>${email}</strong></p>
            <p>© 2024 NCM PRO. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
  `;
};

/**
 * Enviar email de verificação
 */
export const sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const htmlContent = getVerificationEmailTemplate(verificationUrl, email);
    
    // Tentar com Resend API primeiro
    try {
      const { data, error } = await resend.emails.send({
        from: 'NCM PRO <noreply@ncmpro.com>',
        to: [email],
        subject: 'Confirme seu email - NCM PRO',
        html: htmlContent,
        text: `Confirme seu email clicando no link: ${verificationUrl}`
      });
      
      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }
      
      console.log('Email enviado via Resend API:', data.id);
      return { success: true, provider: 'resend-api', id: data.id };
      
    } catch (resendError) {
      console.warn('Falha na Resend API, tentando SMTP:', resendError.message);
      
      // Fallback para SMTP
      const info = await transporter.sendMail({
        from: '"NCM PRO" <noreply@ncmpro.com>',
        to: email,
        subject: 'Confirme seu email - NCM PRO',
        html: htmlContent,
        text: `Confirme seu email clicando no link: ${verificationUrl}`
      });
      
      console.log('Email enviado via SMTP:', info.messageId);
      return { success: true, provider: 'smtp', id: info.messageId };
    }
    
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
};

/**
 * Enviar email de reset de senha
 */
export const sendPasswordResetEmail = async (email, token) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const htmlContent = getPasswordResetTemplate(resetUrl, email);
    
    // Tentar com Resend API primeiro
    try {
      const { data, error } = await resend.emails.send({
        from: 'NCM PRO <noreply@ncmpro.com>',
        to: [email],
        subject: 'Redefinir senha - NCM PRO',
        html: htmlContent,
        text: `Redefina sua senha clicando no link: ${resetUrl}`
      });
      
      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }
      
      console.log('Email de reset enviado via Resend API:', data.id);
      return { success: true, provider: 'resend-api', id: data.id };
      
    } catch (resendError) {
      console.warn('Falha na Resend API, tentando SMTP:', resendError.message);
      
      // Fallback para SMTP
      const info = await transporter.sendMail({
        from: '"NCM PRO" <noreply@ncmpro.com>',
        to: email,
        subject: 'Redefinir senha - NCM PRO',
        html: htmlContent,
        text: `Redefina sua senha clicando no link: ${resetUrl}`
      });
      
      console.log('Email de reset enviado via SMTP:', info.messageId);
      return { success: true, provider: 'smtp', id: info.messageId };
    }
    
  } catch (error) {
    console.error('Erro ao enviar email de reset:', error);
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
};

/**
 * Testar configuração de email
 */
export const testEmailConfiguration = async () => {
  try {
    // Testar Resend API
    const { data, error } = await resend.emails.send({
      from: 'NCM PRO <noreply@ncmpro.com>',
      to: ['test@example.com'],
      subject: 'Teste de configuração',
      html: '<p>Este é um teste de configuração do email.</p>',
      text: 'Este é um teste de configuração do email.'
    });
    
    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }
    
    return { success: true, provider: 'resend-api', message: 'Configuração OK' };
    
  } catch (error) {
    console.error('Erro na configuração de email:', error);
    return { success: false, error: error.message };
  }
};