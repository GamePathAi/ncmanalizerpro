# API Documentation - Sistema de Autenticação NCM PRO

## Visão Geral

Sistema de autenticação com estados de usuário que resolve o problema circular: usuário precisa estar logado para assinar, mas precisa de assinatura para acessar o sistema.

## Estados do Usuário

### 1. `pending_email`
- **Quando**: Usuário se cadastrou mas não confirmou email
- **Acesso**: Apenas tela "Confirme seu email"
- **Ações permitidas**: Reenviar email de confirmação

### 2. `pending_subscription`
- **Quando**: Email confirmado mas sem assinatura ativa
- **Acesso**: Pode fazer login, mas vê apenas pricing/checkout
- **Ações permitidas**: Assinar planos via Stripe Checkout

### 3. `active`
- **Quando**: Email confirmado + assinatura ativa no Stripe
- **Acesso**: Dashboard completo liberado

## Endpoints da API

### Autenticação

#### POST `/auth/register`
**Descrição**: Registra novo usuário

**Body**:
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (201)**:
```json
{
  "message": "Usuário criado com sucesso. Verifique seu email.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription_status": "pending_email"
  }
}
```

#### POST `/auth/verify-email`
**Descrição**: Confirma email do usuário

#### POST `/auth/login`
**Descrição**: Autentica usuário (permite `pending_subscription`)

#### GET `/auth/me`
**Descrição**: Retorna dados do usuário autenticado

### Webhooks

#### POST `/webhooks/stripe`
**Descrição**: Webhook do Stripe para atualizar status de assinatura

#### POST `/functions/v1/resend-webhook`
**Descrição**: Webhook do Resend para logs de email

## Fluxo Completo

1. **Cadastro**: POST /register → cria user pending_email → envia email
2. **Verificação**: Click no link → POST /verify-email → muda para pending_subscription
3. **Login**: POST /login → permite acesso se email verificado
4. **Assinatura**: Na PricingPage → Stripe Checkout → webhook → muda para active
5. **Acesso**: Dashboard liberado