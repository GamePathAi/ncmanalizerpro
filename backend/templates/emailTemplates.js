/**
 * Templates de email responsivos para o sistema de autenticação
 */

/**
 * Template base para todos os emails
 */
const baseTemplate = (content, title = 'NCM Analyzer Pro') => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title}</title>
    <style>
        /* Reset CSS */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            color: #e2e8f0;
            font-size: 16px;
            margin: 0;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .content h2 {
            color: #1a202c;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .content p {
            color: #4a5568;
            font-size: 16px;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        
        .button:hover {
            transform: translateY(-2px);
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .info-box {
            background-color: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .info-box p {
            margin-bottom: 10px;
            color: #2d3748;
        }
        
        .info-box p:last-child {
            margin-bottom: 0;
        }
        
        .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            color: #718096;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 30px 0;
        }
        
        .warning {
            background-color: #fef5e7;
            border-left: 4px solid #f6ad55;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .warning p {
            color: #744210;
            margin: 0;
            font-size: 14px;
        }
        
        /* Responsive */
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
            
            .content h2 {
                font-size: 20px;
            }
            
            .button {
                display: block;
                width: 100%;
                padding: 16px;
            }
            
            .footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div style="padding: 20px 0;">
        <div class="container">
            ${content}
        </div>
    </div>
</body>
</html>
`;

/**
 * Template de confirmação de email
 */
const emailVerificationTemplate = ({
  userName = 'Usuário',
  verificationUrl,
  expirationHours = 24
}) => {
  const content = `
    <div class="header">
        <h1>NCM Analyzer Pro</h1>
        <p>Plataforma de Análise Inteligente</p>
    </div>
    
    <div class="content">
        <h2>Confirme seu email</h2>
        
        <p>Olá <strong>${userName}</strong>,</p>
        
        <p>Obrigado por se cadastrar no NCM Analyzer Pro! Para completar seu cadastro e começar a usar nossa plataforma, você precisa confirmar seu endereço de email.</p>
        
        <div class="button-container">
            <a href="${verificationUrl}" class="button">Confirmar Email</a>
        </div>
        
        <div class="info-box">
            <p><strong>Por que preciso confirmar meu email?</strong></p>
            <p>• Garantir a segurança da sua conta</p>
            <p>• Receber notificações importantes</p>
            <p>• Recuperar sua senha quando necessário</p>
            <p>• Acessar todas as funcionalidades da plataforma</p>
        </div>
        
        <div class="divider"></div>
        
        <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p style="word-break: break-all; background-color: #f7fafc; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">
            ${verificationUrl}
        </p>
        
        <div class="warning">
            <p><strong>Importante:</strong> Este link expira em ${expirationHours} horas por motivos de segurança.</p>
        </div>
    </div>
    
    <div class="footer">
        <p>Se você não criou uma conta no NCM Analyzer Pro, pode ignorar este email.</p>
        <p>Precisa de ajuda? <a href="mailto:support@ncmanalyzerpro.com">Entre em contato conosco</a></p>
        <p>© 2024 NCM Analyzer Pro. Todos os direitos reservados.</p>
    </div>
  `;
  
  return baseTemplate(content, 'Confirme seu email - NCM Analyzer Pro');
};

/**
 * Template de redefinição de senha
 */
const passwordResetTemplate = ({
  userName = 'Usuário',
  resetUrl,
  expirationHours = 1
}) => {
  const content = `
    <div class="header">
        <h1>NCM Analyzer Pro</h1>
        <p>Redefinição de Senha</p>
    </div>
    
    <div class="content">
        <h2>Redefinir sua senha</h2>
        
        <p>Olá <strong>${userName}</strong>,</p>
        
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no NCM Analyzer Pro. Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
        
        <div class="button-container">
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
        </div>
        
        <div class="info-box">
            <p><strong>Dicas para uma senha segura:</strong></p>
            <p>• Use pelo menos 8 caracteres</p>
            <p>• Combine letras maiúsculas e minúsculas</p>
            <p>• Inclua números e símbolos</p>
            <p>• Evite informações pessoais óbvias</p>
        </div>
        
        <div class="divider"></div>
        
        <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p style="word-break: break-all; background-color: #f7fafc; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">
            ${resetUrl}
        </p>
        
        <div class="warning">
            <p><strong>Importante:</strong> Este link expira em ${expirationHours} hora(s) por motivos de segurança.</p>
        </div>
    </div>
    
    <div class="footer">
        <p>Se você não solicitou a redefinição de senha, pode ignorar este email com segurança.</p>
        <p>Sua senha atual permanecerá inalterada até que você crie uma nova.</p>
        <p>Precisa de ajuda? <a href="mailto:support@ncmanalyzerpro.com">Entre em contato conosco</a></p>
        <p>© 2024 NCM Analyzer Pro. Todos os direitos reservados.</p>
    </div>
  `;
  
  return baseTemplate(content, 'Redefinir senha - NCM Analyzer Pro');
};

/**
 * Template de boas-vindas após verificação
 */
const welcomeTemplate = ({
  userName = 'Usuário',
  dashboardUrl,
  pricingUrl
}) => {
  const content = `
    <div class="header">
        <h1>Bem-vindo ao NCM Analyzer Pro!</h1>
        <p>Sua conta foi verificada com sucesso</p>
    </div>
    
    <div class="content">
        <h2>🎉 Parabéns, ${userName}!</h2>
        
        <p>Seu email foi verificado com sucesso e sua conta está pronta para uso. Agora você pode aproveitar todos os recursos da nossa plataforma de análise inteligente.</p>
        
        <div class="info-box">
            <p><strong>Próximos passos:</strong></p>
            <p>1. Escolha um plano que atenda às suas necessidades</p>
            <p>2. Configure seu perfil e preferências</p>
            <p>3. Comece sua primeira análise</p>
            <p>4. Explore nossos recursos avançados</p>
        </div>
        
        <div class="button-container">
            <a href="${pricingUrl}" class="button">Escolher Plano</a>
        </div>
        
        <div class="divider"></div>
        
        <p><strong>O que você pode fazer com o NCM Analyzer Pro:</strong></p>
        <p>• Análises detalhadas e precisas</p>
        <p>• Relatórios personalizados</p>
        <p>• Integração com suas ferramentas</p>
        <p>• Suporte especializado</p>
        <p>• Atualizações constantes</p>
    </div>
    
    <div class="footer">
        <p>Precisa de ajuda para começar? Nossa equipe está aqui para ajudar!</p>
        <p><a href="mailto:support@ncmanalyzerpro.com">Fale conosco</a> | <a href="${dashboardUrl}">Acessar Dashboard</a></p>
        <p>© 2024 NCM Analyzer Pro. Todos os direitos reservados.</p>
    </div>
  `;
  
  return baseTemplate(content, 'Bem-vindo - NCM Analyzer Pro');
};

/**
 * Template de confirmação de assinatura
 */
const subscriptionConfirmationTemplate = ({
  userName = 'Usuário',
  planName,
  planPrice,
  billingCycle,
  dashboardUrl,
  manageUrl
}) => {
  const content = `
    <div class="header">
        <h1>Assinatura Confirmada!</h1>
        <p>Bem-vindo ao ${planName}</p>
    </div>
    
    <div class="content">
        <h2>🚀 Sua assinatura está ativa!</h2>
        
        <p>Olá <strong>${userName}</strong>,</p>
        
        <p>Parabéns! Sua assinatura do plano <strong>${planName}</strong> foi confirmada e já está ativa. Agora você tem acesso completo a todos os recursos da nossa plataforma.</p>
        
        <div class="info-box">
            <p><strong>Detalhes da sua assinatura:</strong></p>
            <p>• Plano: ${planName}</p>
            <p>• Valor: R$ ${planPrice}/${billingCycle}</p>
            <p>• Status: Ativo</p>
            <p>• Próxima cobrança: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</p>
        </div>
        
        <div class="button-container">
            <a href="${dashboardUrl}" class="button">Acessar Dashboard</a>
        </div>
        
        <div class="divider"></div>
        
        <p><strong>O que está incluído no seu plano:</strong></p>
        <p>• Análises ilimitadas</p>
        <p>• Relatórios avançados</p>
        <p>• Suporte prioritário</p>
        <p>• Integrações API</p>
        <p>• Backup automático</p>
        
        <p>Você pode gerenciar sua assinatura, atualizar informações de pagamento e ver seu histórico de faturas a qualquer momento.</p>
        
        <div class="button-container">
            <a href="${manageUrl}" class="button" style="background: #718096;">Gerenciar Assinatura</a>
        </div>
    </div>
    
    <div class="footer">
        <p>Obrigado por escolher o NCM Analyzer Pro!</p>
        <p>Precisa de ajuda? <a href="mailto:support@ncmanalyzerpro.com">Nossa equipe está aqui para ajudar</a></p>
        <p>© 2024 NCM Analyzer Pro. Todos os direitos reservados.</p>
    </div>
  `;
  
  return baseTemplate(content, 'Assinatura Confirmada - NCM Analyzer Pro');
};

/**
 * Template de cancelamento de assinatura
 */
const subscriptionCancelledTemplate = ({
  userName = 'Usuário',
  planName,
  endDate,
  reactivateUrl
}) => {
  const content = `
    <div class="header">
        <h1>Assinatura Cancelada</h1>
        <p>Sentiremos sua falta</p>
    </div>
    
    <div class="content">
        <h2>Sua assinatura foi cancelada</h2>
        
        <p>Olá <strong>${userName}</strong>,</p>
        
        <p>Confirmamos o cancelamento da sua assinatura do plano <strong>${planName}</strong>. Você continuará tendo acesso a todos os recursos até <strong>${new Date(endDate).toLocaleDateString('pt-BR')}</strong>.</p>
        
        <div class="info-box">
            <p><strong>O que acontece agora:</strong></p>
            <p>• Acesso completo até ${new Date(endDate).toLocaleDateString('pt-BR')}</p>
            <p>• Não haverá mais cobranças</p>
            <p>• Seus dados serão preservados por 90 dias</p>
            <p>• Você pode reativar a qualquer momento</p>
        </div>
        
        <p>Mudou de ideia? Você pode reativar sua assinatura a qualquer momento antes da data de expiração:</p>
        
        <div class="button-container">
            <a href="${reactivateUrl}" class="button">Reativar Assinatura</a>
        </div>
        
        <div class="divider"></div>
        
        <p>Gostaríamos muito de saber o motivo do cancelamento para melhorarmos nossos serviços. Sua opinião é muito importante para nós!</p>
    </div>
    
    <div class="footer">
        <p>Obrigado por ter usado o NCM Analyzer Pro!</p>
        <p>Tem feedback? <a href="mailto:feedback@ncmanalyzerpro.com">Adoraríamos ouvir você</a></p>
        <p>© 2024 NCM Analyzer Pro. Todos os direitos reservados.</p>
    </div>
  `;
  
  return baseTemplate(content, 'Assinatura Cancelada - NCM Analyzer Pro');
};

/**
 * Template de falha no pagamento
 */
const paymentFailedTemplate = ({
  userName = 'Usuário',
  planName,
  amount,
  updatePaymentUrl,
  retryDate
}) => {
  const content = `
    <div class="header">
        <h1>Problema com o Pagamento</h1>
        <p>Ação necessária</p>
    </div>
    
    <div class="content">
        <h2>⚠️ Falha no pagamento</h2>
        
        <p>Olá <strong>${userName}</strong>,</p>
        
        <p>Não conseguimos processar o pagamento da sua assinatura do plano <strong>${planName}</strong> no valor de <strong>R$ ${amount}</strong>.</p>
        
        <div class="warning">
            <p><strong>Sua assinatura será suspensa em breve se o pagamento não for atualizado.</strong></p>
        </div>
        
        <div class="info-box">
            <p><strong>Possíveis causas:</strong></p>
            <p>• Cartão de crédito expirado</p>
            <p>• Limite insuficiente</p>
            <p>• Dados de pagamento desatualizados</p>
            <p>• Problema temporário com o banco</p>
        </div>
        
        <p>Para manter sua assinatura ativa, atualize suas informações de pagamento:</p>
        
        <div class="button-container">
            <a href="${updatePaymentUrl}" class="button">Atualizar Pagamento</a>
        </div>
        
        <div class="divider"></div>
        
        <p>Tentaremos processar o pagamento novamente em <strong>${new Date(retryDate).toLocaleDateString('pt-BR')}</strong>. Se o problema persistir, sua assinatura será suspensa temporariamente.</p>
        
        <p>Não se preocupe - seus dados estarão seguros e você poderá reativar sua conta a qualquer momento.</p>
    </div>
    
    <div class="footer">
        <p>Precisa de ajuda? <a href="mailto:billing@ncmanalyzerpro.com">Nossa equipe de cobrança está aqui para ajudar</a></p>
        <p>© 2024 NCM Analyzer Pro. Todos os direitos reservados.</p>
    </div>
  `;
  
  return baseTemplate(content, 'Problema com Pagamento - NCM Analyzer Pro');
};

module.exports = {
  emailVerificationTemplate,
  passwordResetTemplate,
  welcomeTemplate,
  subscriptionConfirmationTemplate,
  subscriptionCancelledTemplate,
  paymentFailedTemplate
};