# 🚀 Guia Passo a Passo: Configurar SMTP no Supabase Dashboard

## ✅ Problema Identificado

O erro "Error sending confirmation email" acontece porque o **SMTP não está configurado** no Supabase Dashboard.

## 📋 Configuração Necessária

### 1️⃣ Acessar o Dashboard do Supabase

1. Abra seu navegador
2. Acesse: **https://supabase.com/dashboard/project/fsntzljufghutoyqxokm**
3. Faça login na sua conta Supabase

### 2️⃣ Navegar para Configurações de Autenticação

1. No menu lateral esquerdo, clique em **"Authentication"**
2. Clique em **"Settings"** (no submenu de Authentication)
3. Role a página para baixo até encontrar a seção **"SMTP Settings"**

### 3️⃣ Configurar SMTP do Resend

Na seção **SMTP Settings**, preencha EXATAMENTE os seguintes valores:

```
✅ Enable custom SMTP: MARQUE esta opção

📧 SMTP Configuration:
┌─────────────────────────────────────────────────────────┐
│ Host: smtp.resend.com                                   │
│ Port: 587                                               │
│ Username: resend                                        │
│ Password: re_JLRPpf2z_NRDkD1X5LwrggsUJeE4uHN4Y         │
│ Sender name: NCM Analyzer Pro                           │
│ Sender email: noreply@ncmanalyzerpro.com                │
└─────────────────────────────────────────────────────────┘
```

### 4️⃣ Configurar Templates de Email (Opcional)

Na mesma página, você pode personalizar os templates:

**Template de Confirmação:**
```
Subject: 🚗 Confirme seu email - NCM Analyzer Pro

Body (HTML):
<h2>Confirme seu email</h2>
<p>Olá!</p>
<p>Clique no link abaixo para confirmar seu email:</p>
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
<p>Se você não se cadastrou, ignore este email.</p>
```

### 5️⃣ Salvar Configurações

1. Role até o final da página
2. Clique no botão **"Save"** ou **"Update"**
3. Aguarde a confirmação de que as configurações foram salvas

## 🧪 Testar a Configuração

Após salvar, execute este comando para testar:

```bash
node test-frontend-signup.js
```

Ou teste diretamente no frontend:
```
http://localhost:5173
```

## 🔧 Alternativa Rápida (Desenvolvimento)

Se você quiser testar rapidamente sem configurar SMTP:

1. Na mesma página de **Authentication > Settings**
2. Encontre a seção **"User Signups"**
3. **DESMARQUE** "Enable email confirmations"
4. **MARQUE** "Enable automatic confirmation for new users"
5. Clique em **"Save"**

## ✅ Verificação Final

Após a configuração, você deve ver:

- ✅ SMTP configurado com Resend
- ✅ Emails sendo enviados sem erro
- ✅ Usuários conseguindo se cadastrar
- ✅ Emails de confirmação chegando na caixa de entrada

## 🚨 Troubleshooting

### Se ainda houver erro:

1. **Verifique a API Key do Resend:**
   - Acesse https://resend.com/api-keys
   - Confirme se a key `re_JLRPpf2z_NRDkD1X5LwrggsUJeE4uHN4Y` está ativa

2. **Verifique o domínio:**
   - No Resend, confirme se `ncmanalyzerpro.com` está verificado
   - Para desenvolvimento, você pode usar `onboarding@resend.dev`

3. **Logs do Supabase:**
   - Vá em **Logs** > **Auth** no dashboard
   - Verifique se há erros específicos

## 📞 Próximos Passos

Após configurar o SMTP:

1. ✅ Testar cadastro no frontend
2. ⏳ Configurar auth hook
3. ⏳ Testar fluxo completo
4. ⏳ Implementar TOTP

---

🎯 **Objetivo:** Resolver o erro "Error sending confirmation email" configurando SMTP do Resend no Supabase Dashboard.

💡 **Dica:** A configuração SMTP é essencial para produção. Para desenvolvimento, você pode usar a confirmação automática.