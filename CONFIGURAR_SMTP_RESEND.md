# Configuração SMTP Customizado com Resend no Supabase

## 🚨 Problema Atual

Mesmo após desabilitar a confirmação de email, o erro persiste:
```
Error sending confirmation email (código 500)
```

Isso indica que o Supabase ainda está tentando enviar emails e falhando.

## ✅ Solução: SMTP Customizado com Resend

### 1. **Obter Credenciais do Resend**

Você já tem a API key configurada no `.env`:
```
RESEND_API_KEY=re_...
```

### 2. **Configurar SMTP no Dashboard do Supabase**

#### Acesse as Configurações:
1. Vá para [supabase.com](https://supabase.com)
2. Selecione seu projeto
3. **Authentication** > **Settings**
4. Role até **SMTP Settings**

#### Configure os Valores:
```
✅ Enable Custom SMTP: ATIVADO

SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: [SUA_API_KEY_DO_RESEND]
Sender Name: NCM Analyzer Pro
Sender Email: noreply@seudominio.com
```

**IMPORTANTE:** Use a mesma API key que está no seu `.env`

### 3. **Configurações Adicionais**

#### Na seção **User Signups**:
- ✅ **Enable email confirmations**: PODE MANTER ATIVADO agora
- ✅ **Enable phone confirmations**: Desativado (se não usar)

#### Na seção **Email Templates**:
- Personalize os templates se desejar
- Use o domínio configurado no Resend

### 4. **Verificar Domínio no Resend**

Antes de configurar, certifique-se que tem um domínio verificado no Resend:

```bash
node list-domains-resend.js
```

Se não tiver domínio, pode usar:
- **Para testes**: `onboarding@resend.dev`
- **Para produção**: Configure um domínio próprio

### 5. **Testar Configuração**

Após configurar o SMTP:

```bash
node test-signup-simple.js
```

**Resultado esperado:**
- ✅ Cadastro bem-sucedido
- ✅ Email enviado via Resend
- ✅ Login funcionando

## 🔧 Configuração Alternativa (Sem Email)

Se preferir não usar emails por enquanto:

### No Dashboard do Supabase:
1. **Authentication** > **Settings**
2. **User Signups**:
   - ☐ **Enable email confirmations**: DESMARCAR
   - ☐ **Enable phone confirmations**: DESMARCAR
3. **SMTP Settings**:
   - ☐ **Enable Custom SMTP**: DESMARCAR

## 📋 Checklist de Configuração

### Opção 1: Com SMTP Customizado
- [ ] API key do Resend obtida
- [ ] Domínio verificado no Resend (ou usar onboarding@resend.dev)
- [ ] SMTP configurado no Supabase
- [ ] Email confirmations ATIVADO
- [ ] Teste realizado com sucesso

### Opção 2: Sem Email
- [ ] Email confirmations DESATIVADO
- [ ] SMTP customizado DESATIVADO
- [ ] Teste realizado com sucesso

## 🚨 Troubleshooting

### Se ainda der erro após SMTP:
1. Verificar se a API key está correta
2. Verificar se o domínio está verificado no Resend
3. Testar com `onboarding@resend.dev` temporariamente
4. Verificar logs no dashboard do Supabase

### Se der erro sem SMTP:
1. Confirmar que email confirmations está DESATIVADO
2. Limpar cache do navegador
3. Aguardar alguns minutos para propagação

## 📞 Próximos Passos

1. **Escolher uma opção** (com ou sem SMTP)
2. **Configurar no dashboard** seguindo o guia
3. **Testar** com o script fornecido
4. **Confirmar** que a aplicação funciona

---

**Status:** Aguardando configuração no dashboard do Supabase