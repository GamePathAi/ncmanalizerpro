# Configuração do Provedor de Email Resend no Supabase

## 📧 Passo a Passo para Configurar SMTP Personalizado

### 1. Acessar Dashboard do Supabase
1. Abra o dashboard: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm
2. Vá para **Authentication** > **Settings**
3. Role até a seção **SMTP Settings**

### 2. Configurar SMTP do Resend
Preencha os seguintes campos:

```
📧 SMTP Settings:
- Enable custom SMTP: ✅ Habilitado
- Host: smtp.resend.com
- Port: 587
- Username: resend
- Password: re_JLRPpf2z_NRDkD1X5LwrggsUJeE4uHN4Y (sua API key do Resend)
- Sender name: NCM Analyzer Pro
- Sender email: noreply@ncmanalyzerpro.com
```

### 3. Configurar Templates de Email
Na seção **Email Templates**:

#### Template de Confirmação:
```
Subject: Confirme seu email - NCM Analyzer Pro

Body (HTML):
<h2>Confirme seu email</h2>
<p>Olá!</p>
<p>Clique no link abaixo para confirmar seu email:</p>
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
<p>Se você não se cadastrou, ignore este email.</p>
```

#### Template de Recuperação de Senha:
```
Subject: Redefinir senha - NCM Analyzer Pro

Body (HTML):
<h2>Redefinir sua senha</h2>
<p>Clique no link abaixo para redefinir sua senha:</p>
<a href="{{ .ConfirmationURL }}">Redefinir Senha</a>
<p>Este link expira em 1 hora.</p>
```

### 4. Configurar Variáveis de Ambiente
Vá para **Edge Functions** > **Settings** e adicione:

```
RESEND_API_KEY=re_JLRPpf2z_NRDkD1X5LwrggsUJeE4uHN4Y
FROM_EMAIL=noreply@ncmanalyzerpro.com
FROM_NAME=NCM Analyzer Pro
APP_URL=https://ncmanalyzerpro.com
```

### 5. Testar Configuração
1. Salve todas as configurações
2. Teste enviando um email de confirmação
3. Verifique os logs em **Logs** > **Auth** para possíveis erros

### 6. Reabilitar Confirmação de Email
Após configurar o SMTP:
1. Vá para **Authentication** > **Settings**
2. Em **User Signups**, certifique-se que:
   - ✅ Enable email confirmations está habilitado
   - ✅ Enable signup está habilitado

## 🔧 Próximos Passos

Após configurar o SMTP:
1. Reabilite o `emailRedirectTo` no código
2. Teste o fluxo completo de cadastro
3. Verifique se os emails estão sendo enviados corretamente

## 📝 Notas Importantes

- A API key do Resend já está configurada no arquivo `.env`
- As edge functions já estão preparadas para usar o Resend
- Certifique-se de que o domínio está verificado no Resend para produção
- Para desenvolvimento, você pode usar o domínio de teste do Resend

## 🚨 Troubleshooting

Se houver problemas:
1. Verifique os logs de autenticação no Supabase
2. Confirme se a API key do Resend está correta
3. Verifique se o SMTP está habilitado
4. Teste com um email válido