# 🔧 RESOLVER PROBLEMA DE EMAIL - GUIA COMPLETO

## 🎯 PROBLEMA IDENTIFICADO

A API key do Resend está **INVÁLIDA**. Por isso os emails não estão sendo enviados.

```
Status: 401
Mensagem: "API key is invalid"
```

## ✅ SOLUÇÃO COMPLETA

### 1. 🔑 GERAR NOVA API KEY DO RESEND

1. Acesse: https://resend.com/api-keys
2. Faça login na sua conta Resend
3. Clique em "Create API Key"
4. Nome sugerido: `NCM Pro - Production`
5. Copie a nova API key (começa com `re_`)

### 2. 📝 ATUALIZAR ARQUIVO .ENV LOCAL

Substitua a linha no arquivo `.env`:

```env
# ANTES (inválida)
RESEND_API_KEY=re_43kupGy2_KP49rUxy...

# DEPOIS (nova API key válida)
RESEND_API_KEY=sua_nova_api_key_aqui
```

### 3. ⚙️ CONFIGURAR NO SUPABASE

1. Acesse: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/settings/functions
2. Na seção "Environment Variables"
3. Adicione:
   - **Name:** `RESEND_API_KEY`
   - **Value:** sua nova API key
4. Clique em "Save"

### 4. 🚀 REDEPLOYAR EDGE FUNCTIONS

```bash
supabase functions deploy
```

### 5. 🧪 TESTAR NOVAMENTE

```bash
# Testar API key diretamente
node test-resend-direct.js

# Testar signup completo
node test-signup-simple.js
```

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Nova API key gerada no Resend
- [ ] Arquivo .env atualizado localmente
- [ ] Variável configurada no Supabase Dashboard
- [ ] Edge Functions redesployadas
- [ ] Teste direto da API passou (status 200)
- [ ] Signup funcionando sem erro 500

## 🎯 RESULTADO ESPERADO

Após seguir todos os passos:

```
✅ API key do Resend está VÁLIDA!
✅ Email de confirmação enviado com sucesso
✅ Usuário cadastrado com status: pending_email
```

## 🔗 LINKS ÚTEIS

- [Resend Dashboard](https://resend.com/dashboard)
- [Supabase Functions Settings](https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/settings/functions)
- [Documentação Resend API](https://resend.com/docs)

---

**⚠️ IMPORTANTE:** Mantenha sua API key segura e nunca a compartilhe publicamente!