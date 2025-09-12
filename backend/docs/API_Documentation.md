# NCM Analyzer Pro - API Documentation

## Visão Geral

Esta documentação descreve a API REST do sistema de autenticação com estados de usuário do NCM Analyzer Pro. O sistema implementa um fluxo completo de autenticação que resolve o problema circular: usuário precisa estar logado para assinar, mas precisa de assinatura para acessar o sistema.

## Estados do Usuário

O sistema possui três estados principais:

- **`pending_email`**: Usuário cadastrado mas não confirmou email
- **`pending_subscription`**: Email confirmado mas sem assinatura ativa
- **`active`**: Email confirmado + assinatura ativa no Stripe

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.ncmanalyzerpro.com
```

## Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. O token deve ser incluído no header `Authorization`:

```
Authorization: Bearer <jwt_token>
```

## Endpoints de Autenticação

### POST /auth/register

Cria uma nova conta de usuário.

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senhaSegura123",
  "fullName": "Nome Completo"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "fullName": "Nome Completo",
    "subscriptionStatus": "pending_email"
  },
  "emailSent": true
}
```

**Errors:**
- `400`: Dados inválidos
- `409`: Email já cadastrado
- `429`: Muitas tentativas

---

### POST /auth/verify-email

Confirma o email do usuário usando token de verificação.

**Request Body:**
```json
{
  "token": "jwt_verification_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verificado com sucesso",
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "subscriptionStatus": "pending_subscription",
    "emailVerifiedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400`: Token inválido ou expirado
- `404`: Usuário não encontrado

---

### POST /auth/login

Autentica usuário e retorna token de acesso.

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senhaSegura123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "fullName": "Nome Completo",
    "subscriptionStatus": "pending_subscription"
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

**Errors:**
- `400`: Credenciais inválidas
- `401`: Email não verificado
- `429`: Muitas tentativas

---

### POST /auth/resend-verification

Reenvia email de verificação.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email de verificação reenviado",
  "emailSent": true
}
```

**Errors:**
- `400`: Email já verificado
- `429`: Muitas tentativas

---

### GET /auth/me

Retorna informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "fullName": "Nome Completo",
    "subscriptionStatus": "active",
    "emailVerifiedAt": "2024-01-15T10:30:00Z",
    "currentPlan": "professional",
    "planExpiresAt": "2024-02-15T10:30:00Z"
  }
}
```

---

### POST /auth/logout

Invalida token de acesso atual.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

### GET /auth/check-state

Verifica estado atual do usuário para redirecionamento.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "state": "pending_subscription",
  "redirectTo": "/pricing",
  "canAccess": {
    "dashboard": false,
    "pricing": true,
    "emailVerification": false
  }
}
```

## Endpoints do Stripe

### POST /stripe/create-checkout-session

Cria sessão de checkout do Stripe.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "priceId": "price_stripe_id",
  "successUrl": "http://localhost:3000/success",
  "cancelUrl": "http://localhost:3000/pricing"
}
```

**Response (200):**
```json
{
  "success": true,
  "sessionId": "cs_stripe_session_id",
  "url": "https://checkout.stripe.com/pay/cs_..."
}
```

---

### GET /stripe/session/:sessionId

Retorna detalhes de uma sessão de checkout.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "session": {
    "id": "cs_stripe_session_id",
    "status": "complete",
    "paymentStatus": "paid",
    "customerEmail": "usuario@exemplo.com"
  }
}
```

---

### GET /stripe/prices

Lista preços disponíveis do Stripe.

**Response (200):**
```json
{
  "success": true,
  "prices": [
    {
      "id": "price_starter",
      "nickname": "Starter",
      "unitAmount": 2900,
      "currency": "brl",
      "recurring": {
        "interval": "month"
      }
    }
  ]
}
```

---

### GET /stripe/subscription

Retorna informações da assinatura atual.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_stripe_id",
    "status": "active",
    "currentPeriodEnd": "2024-02-15T10:30:00Z",
    "plan": {
      "name": "Professional",
      "amount": 4900,
      "interval": "month"
    }
  }
}
```

---

### POST /stripe/customer-portal

Cria sessão do portal do cliente Stripe.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "returnUrl": "http://localhost:3000/dashboard"
}
```

**Response (200):**
```json
{
  "success": true,
  "url": "https://billing.stripe.com/session/..."
}
```

## Webhook do Stripe

### POST /webhooks/stripe

Recebe eventos do Stripe para atualizar status de assinatura.

**Headers:**
```
stripe-signature: <stripe_signature>
```

**Eventos Suportados:**
- `checkout.session.completed`: Ativa assinatura
- `customer.subscription.deleted`: Cancela assinatura
- `invoice.payment_failed`: Suspende por falha de pagamento
- `customer.subscription.updated`: Atualiza informações

**Response (200):**
```json
{
  "received": true
}
```

## Middleware de Autenticação

### requireAuth

Verifica se usuário está autenticado.

### requireEmailVerified

Exige que email esteja verificado (`pending_subscription` ou `active`).

### requireActiveSubscription

Exige assinatura ativa (`active`).

### checkUserState

Verifica estado e redireciona conforme necessário.

## Rate Limiting

Todos os endpoints possuem rate limiting:

- **Autenticação**: 5 tentativas por 15 minutos
- **Email**: 3 envios por hora
- **API Geral**: 100 requests por 15 minutos

## Códigos de Status HTTP

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Dados inválidos
- `401`: Não autorizado
- `403`: Acesso negado
- `404`: Não encontrado
- `409`: Conflito (ex: email já existe)
- `429`: Muitas tentativas
- `500`: Erro interno do servidor

## Estrutura de Erro Padrão

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou senha incorretos",
    "details": {}
  }
}
```

## Fluxo Completo de Usuário

1. **Cadastro**: `POST /auth/register` → Status: `pending_email`
2. **Verificação**: `POST /auth/verify-email` → Status: `pending_subscription`
3. **Login**: `POST /auth/login` → Acesso à página de pricing
4. **Assinatura**: `POST /stripe/create-checkout-session` → Checkout Stripe
5. **Webhook**: Stripe confirma pagamento → Status: `active`
6. **Acesso**: Dashboard liberado automaticamente

## Variáveis de Ambiente Necessárias

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# JWT
JWT_SECRET=your_jwt_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (Email)
RESEND_API_KEY=re_...

# URLs
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:3001

# Ambiente
NODE_ENV=development
```

## Segurança

- Tokens JWT com expiração
- Rate limiting em endpoints sensíveis
- Validação de entrada rigorosa
- Logs de segurança para auditoria
- CORS configurado adequadamente
- Senhas hasheadas com salt
- Tokens de verificação com hash SHA-256

## Logs de Auditoria

Todos os eventos de autenticação são registrados na tabela `auth_events`:

- Login/logout
- Registro de usuário
- Verificação de email
- Mudanças de assinatura
- Tentativas de acesso negado

## Suporte

Para dúvidas sobre a API:
- Email: dev@ncmanalyzerpro.com
- Documentação: https://docs.ncmanalyzerpro.com