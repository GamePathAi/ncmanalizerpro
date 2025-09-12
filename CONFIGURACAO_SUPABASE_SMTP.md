# 📧 Configuração SMTP no Supabase - NCM Analyzer PRO

## ✅ Status Atual
- ✅ Domínio `ncmanalyzer.com.br` verificado no Resend
- ✅ Email `noreply@ncmanalyzer.com.br` funcionando
- ✅ API Key do Resend configurada
- ✅ Teste de envio realizado com sucesso

## 🔧 Configuração no Supabase

### 1. Acessar Configurações SMTP
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto NCM Analyzer PRO
3. Vá em **Authentication** → **Settings** → **SMTP Settings**

### 2. Configurar Credenciais SMTP
```
Enable custom SMTP: ✅ Habilitado

Host: smtp.resend.com
Port: 465
Username: resend
Password: re_cUYtKFVN_PKKTwpTDy81aaDFZNWKmwYsz

Sender email: noreply@ncmanalyzer.com.br
Sender name: NCM Analyzer PRO
```

### 3. Configurar Templates de Email

#### Template de Confirmação de Email
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">NCM Analyzer PRO</h1>
    <p style="color: #6b7280; margin: 5px 0 0 0;">Plataforma de Análise de NCM</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 12px; border-left: 4px solid #2563eb;">
    <h2 style="color: #1e293b; margin-top: 0;">🎉 Confirme seu email</h2>
    
    <p style="color: #475569; line-height: 1.6;">Olá!</p>
    
    <p style="color: #475569; line-height: 1.6;">
      Obrigado por se cadastrar no <strong>NCM Analyzer PRO</strong>. 
      Para ativar sua conta, clique no botão abaixo:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: #2563eb; color: white; padding: 12px 30px; 
                text-decoration: none; border-radius: 6px; font-weight: bold;
                display: inline-block;">Confirmar Email</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
      Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
      <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
    </p>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Este link expira em 24 horas por segurança.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
    <p>NCM Analyzer PRO - Análise Inteligente de Classificação Fiscal</p>
    <p>Este email foi enviado automaticamente. Não responda a este email.</p>
  </div>
</div>
```

#### Template de Recuperação de Senha
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">NCM Analyzer PRO</h1>
    <p style="color: #6b7280; margin: 5px 0 0 0;">Plataforma de Análise de NCM</p>
  </div>
  
  <div style="background: #fef2f2; padding: 30px; border-radius: 12px; border-left: 4px solid #ef4444;">
    <h2 style="color: #1e293b; margin-top: 0;">🔐 Redefinir senha</h2>
    
    <p style="color: #475569; line-height: 1.6;">Olá!</p>
    
    <p style="color: #475569; line-height: 1.6;">
      Recebemos uma solicitação para redefinir a senha da sua conta no 
      <strong>NCM Analyzer PRO</strong>. Clique no botão abaixo para criar uma nova senha:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: #ef4444; color: white; padding: 12px 30px; 
                text-decoration: none; border-radius: 6px; font-weight: bold;
                display: inline-block;">Redefinir Senha</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
      Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
      <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
    </p>
    
    <p style="color: #dc2626; font-size: 14px; margin-top: 20px;">
      ⚠️ Se você não solicitou esta redefinição, ignore este email. 
      Sua senha permanecerá inalterada.
    </p>
    
    <p style="color: #6b7280; font-size: 14px;">
      Este link expira em 1 hora por segurança.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
    <p>NCM Analyzer PRO - Análise Inteligente de Classificação Fiscal</p>
    <p>Este email foi enviado automaticamente. Não responda a este email.</p>
  </div>
</div>
```

## 🧪 Teste da Configuração

### 1. Testar Envio Manual
Após configurar o SMTP no Supabase, teste enviando um email de confirmação:

```javascript
// No console do Supabase ou em um script de teste
const { data, error } = await supabase.auth.signUp({
  email: 'seu-email-teste@gmail.com',
  password: 'senha-teste-123'
});
```

### 2. Verificar Logs
- Vá em **Authentication** → **Logs** no Supabase
- Verifique se não há erros de SMTP
- Confirme se os emails estão sendo enviados

### 3. Testar Fluxo Completo
```bash
# Execute o teste completo do sistema
node test-flow-without-email.js
```

## 🔍 Troubleshooting

### Erro: "SMTP configuration invalid"
- Verifique se todas as credenciais estão corretas
- Confirme se o domínio está verificado no Resend
- Teste a API key do Resend separadamente

### Emails não chegam
- Verifique a pasta de spam
- Confirme se o email de destino está correto
- Verifique os logs do Supabase

### Erro de autenticação SMTP
- Confirme se está usando `resend` como username
- Verifique se a API key está correta
- Teste com porta 587 se 465 não funcionar

## 📋 Checklist Final

- [ ] SMTP configurado no Supabase
- [ ] Templates de email personalizados
- [ ] Teste de cadastro realizado
- [ ] Email de confirmação recebido
- [ ] Fluxo de recuperação de senha testado
- [ ] Logs verificados sem erros

## 🎯 Próximos Passos

1. **Configurar SMTP no Supabase** (seguir este guia)
2. **Testar cadastro de usuário real**
3. **Implementar componentes de segurança no frontend**
4. **Deploy e testes em produção**

---

**✅ Sistema de autenticação funcionalmente completo!**

Após configurar o SMTP, o sistema estará 100% operacional com:
- Estados de usuário (pending_email, pending_subscription, active)
- Validações de segurança completas
- Integração com Stripe para assinaturas
- Envio de emails transacionais