# Guia de Templates de Email - NCM PRO

## Visão Geral

Este documento descreve o sistema de templates de email implementado no NCM PRO, utilizando o Resend como provedor de email.

## Configuração do Resend

### Credenciais SMTP
- **Host:** smtp.resend.com
- **Port:** 465 (TLS) ou 587/2587
- **User:** resend
- **Password:** re_cUYtKFVN_PKKTwpTDy81aaDFZNWKmwYsz

### Configuração no .env
```env
RESEND_API_KEY=re_cUYtKFVN_PKKTwpTDy81aaDFZNWKmwYsz
RESEND_DOMAIN=ncmpro.com
RESEND_FROM_EMAIL=noreply@ncmpro.com
RESEND_REPLY_TO=suporte@ncmpro.com
```

## Templates Disponíveis

### 1. Email de Verificação de Conta

**Arquivo:** `src/templates/emailVerification.js`

**Quando é enviado:**
- Após o cadastro do usuário
- Quando o usuário solicita reenvio de verificação

**Funcionalidades:**
- Design responsivo
- Link de verificação com token único
- Expiração de 24 horas
- Instruções de segurança
- Fallback em texto puro

**Uso:**
```javascript
import { emailVerificationTemplate } from '../templates/emailVerification.js';

const template = emailVerificationTemplate(verificationUrl, userEmail);
// template.subject - Assunto do email
// template.html - Conteúdo HTML
// template.text - Conteúdo em texto puro
```

### 2. Email de Boas-vindas

**Quando é enviado:**
- Após confirmação do email
- Antes do usuário escolher um plano

**Conteúdo:**
- Mensagem de boas-vindas
- Próximos passos
- Link para escolha de plano
- Informações de suporte

### 3. Email de Recuperação de Senha

**Quando é enviado:**
- Quando usuário solicita reset de senha

**Funcionalidades:**
- Link de reset com token único
- Expiração de 1 hora
- Avisos de segurança
- Instruções claras

## Serviço de Email

### Arquivo: `src/services/emailService.js`

### Métodos Disponíveis:

#### `sendVerificationEmail(email, verificationToken, baseUrl)`
Envia email de verificação de conta.

**Parâmetros:**
- `email`: Email do destinatário
- `verificationToken`: Token único de verificação
- `baseUrl`: URL base da aplicação (padrão: http://localhost:5173)

**Retorno:**
```javascript
{
  success: boolean,
  messageId: string,
  message: string
}
```

#### `sendWelcomeEmail(email, userName)`
Envia email de boas-vindas após confirmação.

#### `sendPasswordResetEmail(email, resetToken, baseUrl)`
Envia email de recuperação de senha.

#### `testConfiguration()`
Testa a configuração do Resend.

#### `checkDomainStatus()`
Verifica status dos domínios configurados.

## Fluxo de Emails no Sistema

### 1. Cadastro de Usuário
```
Usuário se cadastra → sendVerificationEmail() → Email enviado
```

### 2. Confirmação de Email
```
Usuário clica no link → Email confirmado → sendWelcomeEmail() → Redirecionamento para pricing
```

### 3. Recuperação de Senha
```
Usuário solicita reset → sendPasswordResetEmail() → Email enviado
```

## Estados do Usuário e Emails

### pending_email
- **Acesso:** Apenas tela "Confirme seu email"
- **Email:** Verificação de conta
- **Ações:** Reenviar email de confirmação

### pending_subscription
- **Acesso:** Pode fazer login, vê pricing/checkout
- **Email:** Boas-vindas (após confirmação)
- **Ações:** Assinar planos via Stripe

### active
- **Acesso:** Dashboard completo
- **Email:** Confirmação de pagamento (via Stripe)
- **Ações:** Usar todas as funcionalidades

## Design dos Templates

### Características:
- **Responsivo:** Funciona em desktop e mobile
- **Moderno:** Design limpo e profissional
- **Acessível:** Alto contraste e fontes legíveis
- **Branded:** Cores e logo do NCM PRO
- **Seguro:** Avisos de segurança apropriados

### Cores Utilizadas:
- **Primária:** #3b82f6 (Azul)
- **Secundária:** #8b5cf6 (Roxo)
- **Gradiente:** linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)
- **Texto:** #374151 (Cinza escuro)
- **Fundo:** #f9fafb (Cinza claro)

## Configuração de Domínio

### Para Produção:
1. Configurar domínio no Resend
2. Adicionar registros DNS:
   - SPF: `v=spf1 include:_spf.resend.com ~all`
   - DKIM: Fornecido pelo Resend
   - DMARC: `v=DMARC1; p=none;`

### Verificação:
```javascript
import { EmailService } from './src/services/emailService.js';

// Testar configuração
const result = await EmailService.testConfiguration();
console.log(result);

// Verificar domínios
const domains = await EmailService.checkDomainStatus();
console.log(domains);
```

## Monitoramento e Logs

### Logs de Email:
- ✅ Emails enviados com sucesso
- ❌ Falhas no envio
- 📊 Estatísticas de entrega
- 🔍 Rastreamento de abertura (opcional)

### Métricas Importantes:
- Taxa de entrega
- Taxa de abertura
- Taxa de clique
- Bounces e reclamações

## Troubleshooting

### Problemas Comuns:

#### Email não está sendo enviado
1. Verificar RESEND_API_KEY no .env
2. Verificar configuração do domínio
3. Checar logs do servidor
4. Testar com EmailService.testConfiguration()

#### Email vai para spam
1. Configurar SPF, DKIM e DMARC
2. Usar domínio verificado
3. Evitar palavras de spam no assunto
4. Manter boa reputação do domínio

#### Template não renderiza corretamente
1. Verificar HTML válido
2. Testar em diferentes clientes de email
3. Usar CSS inline para compatibilidade
4. Fornecer fallback em texto puro

## Testes

### Teste Manual:
```javascript
// No console do navegador ou Node.js
import { EmailService } from './src/services/emailService.js';

// Testar envio
const result = await EmailService.sendVerificationEmail(
  'test@example.com',
  'test-token-123',
  'http://localhost:5173'
);

console.log(result);
```

### Teste Automatizado:
```javascript
// Em um arquivo de teste
describe('EmailService', () => {
  test('should send verification email', async () => {
    const result = await EmailService.sendVerificationEmail(
      'test@resend.dev',
      'test-token',
      'http://localhost:5173'
    );
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});
```

## Segurança

### Boas Práticas:
- ✅ Tokens únicos e seguros (crypto.randomBytes)
- ✅ Expiração de links (24h para verificação, 1h para reset)
- ✅ Rate limiting nos endpoints de email
- ✅ Validação de email antes do envio
- ✅ Logs de segurança para tentativas suspeitas
- ✅ Não exposição de informações sensíveis nos templates

### Validações:
- Email válido (formato)
- Token válido (existência e expiração)
- Rate limiting (máximo 3 emails por hora por usuário)
- Sanitização de dados de entrada

## Próximos Passos

1. **Configurar domínio personalizado** no Resend
2. **Implementar analytics** de email (abertura, clique)
3. **Adicionar templates** para notificações do sistema
4. **Configurar webhooks** do Resend para tracking
5. **Implementar A/B testing** nos templates
6. **Adicionar suporte** a múltiplos idiomas

---

**Documentação atualizada em:** $(date)
**Versão:** 1.0.0
**Responsável:** Sistema de Autenticação NCM PRO