# 🔧 Configurar API Key do Resend no Supabase

## ❌ Problema Identificado
A API key do Resend está configurada no arquivo `.env` local, mas as **Edge Functions do Supabase** precisam da variável configurada no **painel do Supabase**.

## ✅ Solução Passo a Passo

### 1. Obter a API Key do Resend
1. Acesse: https://resend.com/api-keys
2. Copie sua API key (formato: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`)

### 2. Configurar no Painel do Supabase
1. Acesse: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/settings/functions
2. Vá em **Settings** → **Edge Functions** → **Environment Variables**
3. Adicione a variável:
   - **Nome**: `RESEND_API_KEY`
   - **Valor**: Sua API key do Resend
4. Clique em **Save**

### 3. Redeployar as Edge Functions
```bash
# No terminal, dentro da pasta do projeto:
supabase functions deploy

# Ou deploy individual:
supabase functions deploy send-confirmation-email
supabase functions deploy send-welcome-email
```

### 4. Testar Novamente
```bash
node diagnose-edge-functions.js
```

## 🔍 Verificação
Após configurar, você deve ver:
- ✅ `send-confirmation-email - Funcional OK`
- ✅ Email enviado com sucesso

## 📋 Outras Variáveis Necessárias
Se usar Stripe, configure também:
- **Nome**: `STRIPE_SECRET_KEY`
- **Valor**: Sua secret key do Stripe

## 🚨 Importante
- As variáveis no arquivo `.env` local **NÃO** afetam as Edge Functions
- Edge Functions usam apenas variáveis configuradas no painel do Supabase
- Sempre redeploy após alterar variáveis de ambiente

## 🔗 Links Úteis
- [Painel de Variáveis do Supabase](https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/settings/functions)
- [Dashboard do Resend](https://resend.com/dashboard)
- [Documentação Edge Functions](https://supabase.com/docs/guides/functions)