// Template de email para verificação de conta
export const emailVerificationTemplate = (verificationUrl, userEmail) => {
  return {
    subject: 'Confirme sua conta no NCM PRO',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirme seu email - NCM PRO</title>
    <style>
        /* Reset CSS */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .logo-icon {
            width: 32px;
            height: 32px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
        }
        
        .header-title {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
        }
        
        .header-subtitle {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
        }
        
        .alternative-link {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .alternative-link p {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
        }
        
        .alternative-link code {
            background-color: #e5e7eb;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            word-break: break-all;
        }
        
        .security-notice {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .security-notice h3 {
            color: #92400e;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .security-notice p {
            color: #a16207;
            font-size: 14px;
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
        }
        
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        .social-links {
            margin-top: 20px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #9ca3af;
            text-decoration: none;
            font-size: 14px;
        }
        
        /* Responsivo */
        @media only screen and (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .cta-button {
                display: block;
                width: 100%;
                text-align: center;
            }
            
            .footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>NCM PRO</h1>
            <p>Confirme seu email para continuar</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Olá, ${userName}!
            </div>
            
            <div class="message">
                Obrigado por se cadastrar na <strong>NCM PRO</strong>! Para completar seu cadastro e acessar nossa plataforma, você precisa confirmar seu endereço de email.
            </div>
            
            <div class="message">
                Clique no botão abaixo para verificar seu email e ativar sua conta:
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center;">
                <a href="${verificationLink}" class="cta-button">
                    ✓ Confirmar Email
                </a>
            </div>
            
            <!-- Alternative Link -->
            <div class="alternative-link">
                <p><strong>Não consegue clicar no botão?</strong></p>
                <p>Copie e cole o link abaixo no seu navegador:</p>
                <code>${verificationLink}</code>
            </div>
            
            <!-- Security Notice -->
            <div class="security-notice">
                <h3>🔒 Aviso de Segurança</h3>
                <p>
                    Este link é válido por <strong>24 horas</strong> e só pode ser usado uma vez. 
                    Se você não solicitou este cadastro, pode ignorar este email com segurança.
                </p>
            </div>
            
            <div class="message">
                Após confirmar seu email, você poderá escolher um de nossos planos e começar a usar todas as funcionalidades da NCM PRO.
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>
                <strong>NCM PRO</strong> - Sua plataforma completa para gestão de NCM
            </p>
            <p>
                Este email foi enviado para você porque uma conta foi criada com este endereço.
            </p>
            <p>
                Dúvidas? Entre em contato: 
                <a href="mailto:suporte@ncmpro.com">suporte@ncmpro.com</a>
            </p>
            
            <div class="social-links">
                <a href="#">Política de Privacidade</a> |
                <a href="#">Termos de Uso</a> |
                <a href="#">Suporte</a>
            </div>
        </div>
    </div>
</body>
</html>
  ` } }

// Template de email para reenvio de verificação
export const resendVerificationTemplate = (verificationLink, userName = 'Usuário') => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reenvio - Confirme seu email - NCM PRO</title>
    <style>
        /* Mesmo CSS do template anterior */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
        }
        
        .alternative-link {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .alternative-link p {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
        }
        
        .alternative-link code {
            background-color: #e5e7eb;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            word-break: break-all;
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
        }
        
        .footer a {
            color: #f59e0b;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        @media only screen and (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .cta-button {
                display: block;
                width: 100%;
                text-align: center;
            }
            
            .footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>NCM PRO</h1>
            <p>Novo link de verificação</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Olá, ${userName}!
            </div>
            
            <div class="message">
                Você solicitou um novo link de verificação para sua conta na <strong>NCM PRO</strong>. 
                Use o botão abaixo para confirmar seu email:
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center;">
                <a href="${verificationLink}" class="cta-button">
                    ✓ Confirmar Email Agora
                </a>
            </div>
            
            <!-- Alternative Link -->
            <div class="alternative-link">
                <p><strong>Link alternativo:</strong></p>
                <code>${verificationLink}</code>
            </div>
            
            <div class="message">
                <strong>Importante:</strong> Este novo link substitui qualquer link anterior. 
                Links antigos não funcionarão mais.
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>
                <strong>NCM PRO</strong> - Sua plataforma completa para gestão de NCM
            </p>
            <p>
                Suporte: <a href="mailto:suporte@ncmpro.com">suporte@ncmpro.com</a>
            </p>
        </div>
    </div>
</body>
</html>
  `;
};