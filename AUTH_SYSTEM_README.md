# Sistema de Autenticação NCM Pro

Este documento descreve o sistema completo de autenticação implementado para resolver o problema circular: usuário precisa estar logado para assinar, mas precisa de assinatura para acessar o sistema.

## 📋 Visão Geral

O sistema implementa **3 estados distintos** para usuários, permitindo um fluxo linear e intuitivo:

1. **`pending_email`** - Usuário cadastrado, aguardando confirmação de email
2. **`pending_subscription`** - Email confirmado, aguardando assinatura
3. **`active`** - Email confirmado + assinatura ativa

## 🏗️ Arquitetura

### Backend (Supabase Edge Functions)

```
supabase/functions/
├── auth-endpoints/          # Endpoints de autenticação
├── stripe-webhook/          # Webhook do Stripe
├── create-checkout-session/ # Criação de sessões de pagamento
└── send-verification-email/ # Envio de emails de verificação
```

### Frontend (React Components)

```
src/
├── components/Auth/
│   ├── AuthGuard.tsx           # Proteção de rotas
│   └── ProtectedRoutes.tsx     # Roteamento baseado em estado
├── contexts/
│   └── AuthContext.tsx         # Contexto de autenticação
├── pages/
│   ├── EmailVerificationPage.tsx
│   └── PricingPage.tsx
└── middleware/
    └── authMiddleware.ts       # Middleware de autenticação
```

## 🔄 Fluxo Completo

### 1. Cadastro (Estado: `pending_email`)

```javascript
// POST /auth-endpoints (method: register)
{
  "method": "register",
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Nome do Usuário"
}
```

**O que acontece:**
- Usuário é criado no Supabase Auth
- Perfil é criado na tabela `user_profiles` com `subscription_status: 'pending_email'`
- Email de verificação é enviado via Resend
- Usuário é redirecionado para `EmailVerificationPage`

### 2. Confirmação de Email (Estado: `pending_subscription`)

```javascript
// POST /auth-endpoints (method: verify-email)
{
  "method": "verify-email",
  "token": "verification_token"
}
```

**O que acontece:**
- Token é validado
- `email_verified_at` é definido
- `subscription_status` muda para `'pending_subscription'`
- Usuário pode fazer login e é redirecionado para `PricingPage`

### 3. Login (Permitido após confirmação)

```javascript
// POST /auth-endpoints (method: login)
{
  "method": "login",
  "email": "user@example.com",
  "password": "password123"
}
```

**O que acontece:**
- Login é permitido se `email_verified_at` não for null
- JWT é retornado
- Redirecionamento baseado no `subscription_status`

### 4. Assinatura (Estado: `active`)

```javascript
// POST /create-checkout-session
{
  "priceId": "price_stripe_id",
  "userId": "user_uuid",
  "userEmail": "user@example.com"
}
```

**O que acontece:**
- Sessão de checkout é criada no Stripe
- Usuário é redirecionado para Stripe Checkout
- Após pagamento, webhook atualiza `subscription_status` para `'active'`
- Dashboard é liberado

## 🛡️ Middleware de Autenticação

### AuthGuard Component

```tsx
<AuthGuard 
  requireAuth={true}
  requireEmailVerified={true}
  requireSubscription={true}
  fallback={<LoadingSpinner />}
>
  <Dashboard />
</AuthGuard>
```

### Configurações Disponíveis

| Propriedade | Descrição | Padrão |
|-------------|-----------|--------|
| `requireAuth` | Requer usuário logado | `true` |
| `requireEmailVerified` | Requer email confirmado | `false` |
| `requireSubscription` | Requer assinatura ativa | `false` |
| `allowedStates` | Estados específicos permitidos | `[]` |
| `fallback` | Componente de loading | `<div>Loading...</div>` |

## 📧 Sistema de Email

### Configuração Resend

```env
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=NCM Pro <noreply@ncmpro.com>
```

### Template de Verificação

O sistema inclui um template HTML responsivo com:
- Design moderno e profissional
- Botão de confirmação destacado
- Link alternativo para copiar/colar
- Informações de segurança
- Instruções claras dos próximos passos

## 💳 Integração Stripe

### Configuração

```env
STRIPE_SECRET_KEY=sk_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_your_publishable_key
```

### Planos Disponíveis

```env
REACT_APP_STRIPE_BASIC_MONTHLY_PRICE_ID=price_basic
REACT_APP_STRIPE_PRO_MONTHLY_PRICE_ID=price_pro
REACT_APP_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_enterprise
```

### Webhook Events

O webhook processa os seguintes eventos:
- `checkout.session.completed` - Ativa assinatura
- `customer.subscription.updated` - Atualiza status
- `customer.subscription.deleted` - Cancela assinatura
- `invoice.payment_failed` - Marca como inativa

## 🗄️ Estrutura do Banco de Dados

### Tabela `user_profiles`

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  email_verified_at TIMESTAMPTZ,
  subscription_status VARCHAR NOT NULL DEFAULT 'pending_email',
  stripe_customer_id VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela `email_logs` (Opcional)

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_to VARCHAR NOT NULL,
  email_type VARCHAR NOT NULL,
  resend_id VARCHAR,
  status VARCHAR NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Configuração e Deploy

### 1. Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### 2. Deploy das Edge Functions

```bash
# Deploy todas as functions
supabase functions deploy

# Ou individualmente
supabase functions deploy auth-endpoints
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout-session
supabase functions deploy send-verification-email
```

### 3. Configurar Webhook do Stripe

1. No Stripe Dashboard, vá em "Webhooks"
2. Adicione endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Selecione os eventos necessários
4. Copie o webhook secret para `.env`

## 🧪 Testes

### Teste Automatizado

```bash
node test-auth-flow.js
```

Este script testa:
- ✅ Registro de usuário
- ✅ Criação de perfil
- ✅ Confirmação de email
- ✅ Login
- ✅ Estados do usuário
- ✅ Endpoints da API
- ✅ Simulação de assinatura

### Teste Manual

1. **Registro**: Acesse `/register` e crie uma conta
2. **Email**: Verifique se recebeu o email de confirmação
3. **Confirmação**: Clique no link do email
4. **Login**: Faça login na aplicação
5. **Pricing**: Deve ser redirecionado para a página de preços
6. **Assinatura**: Escolha um plano e complete o pagamento
7. **Dashboard**: Deve ser redirecionado para o dashboard

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Email não enviado
- Verifique `RESEND_API_KEY`
- Confirme domínio verificado no Resend
- Verifique logs da function `send-verification-email`

#### 2. Webhook não funciona
- Verifique `STRIPE_WEBHOOK_SECRET`
- Confirme URL do webhook no Stripe
- Verifique logs da function `stripe-webhook`

#### 3. Usuário não consegue fazer login
- Verifique se `email_verified_at` não é null
- Confirme se `subscription_status` está correto
- Verifique logs de autenticação

#### 4. Redirecionamento incorreto
- Verifique lógica no `AuthGuard`
- Confirme estados no `useUserState`
- Verifique `FRONTEND_URL` nas functions

### Logs e Debugging

```bash
# Ver logs das functions
supabase functions logs auth-endpoints
supabase functions logs stripe-webhook

# Logs em tempo real
supabase functions logs --follow
```

## 📚 Referências

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Stripe Checkout](https://stripe.com/docs/checkout)
- [Resend API](https://resend.com/docs)
- [React Router](https://reactrouter.com/)

## 🔒 Segurança

### Implementado
- ✅ JWT validation em todas as rotas protegidas
- ✅ Rate limiting nos endpoints sensíveis
- ✅ Validação de entrada em todos os endpoints
- ✅ Tokens de verificação com expiração
- ✅ CORS configurado adequadamente
- ✅ Webhook signature verification
- ✅ Sanitização de dados de entrada

### Recomendações Adicionais
- 🔄 Implementar 2FA para contas administrativas
- 🔄 Adicionar captcha no registro
- 🔄 Implementar detecção de tentativas de login suspeitas
- 🔄 Adicionar logs de auditoria detalhados

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Execute o script de teste
3. Verifique os logs das functions
4. Entre em contato com a equipe de desenvolvimento

**Sistema implementado com sucesso! 🎉**