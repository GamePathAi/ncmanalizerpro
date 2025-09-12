# 🔧 Configurar Domínio no Resend para Produção

## Problema Identificado
Erro: `You can only send testing emails to your own email address (gamepathai@gmail.com). To send emails to other recipients, please verify a domain at resend.com/domains`

## Causa
O Resend está em modo de teste e só permite envio para o email do proprietário da conta. Para enviar emails para qualquer usuário, é necessário:
1. Verificar um domínio no Resend
2. Usar um endereço `from` com esse domínio verificado

## Soluções Disponíveis

### Opção 1: Configurar Domínio Próprio (Recomendado para Produção)

#### Passo 1: Adicionar Domínio no Resend
1. Acesse: https://resend.com/domains
2. Clique em "Add Domain"
3. Digite seu domínio (ex: `ncmanalyzerpro.com`)
4. Siga as instruções para configurar os registros DNS

#### Passo 2: Configurar DNS
Adicione estes registros no seu provedor de DNS:
```
Tipo: TXT
Nome: @
Valor: v=spf1 include:_spf.resend.com ~all

Tipo: CNAME
Nome: resend._domainkey
Valor: resend._domainkey.resend.com

Tipo: TXT
Nome: _dmarc
Valor: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

#### Passo 3: Atualizar Configuração do Supabase
No Supabase Dashboard > Authentication > Email Templates:
```
From: "NCM Analyzer Pro" <noreply@seudominio.com>
```

### Opção 2: Usar Subdomínio Gratuito do Resend (Desenvolvimento)

#### Configuração Rápida
1. No Resend Dashboard, use o domínio padrão: `resend.dev`
2. Configure o `from` como: `"NCM Analyzer Pro" <noreply@resend.dev>`

### Opção 3: Solução Temporária para Testes

#### Para Testes Imediatos
Use o email do proprietário da conta como destinatário de teste:
```javascript
// Para testes apenas
const testEmail = 'gamepathai@gmail.com';
```

## Implementação no Supabase

### Configurar SMTP no Supabase Dashboard

1. **Acesse Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Projeto: fsntzljufghutoyqxokm

2. **Vá para Authentication > Settings**

3. **Configure SMTP Settings**
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Password: re_cUYtKFVN_PKKTwpTDy81aaDFZNWKmwYsz
   
   Sender Name: NCM Analyzer Pro
   Sender Email: noreply@seudominio.com (ou noreply@resend.dev)
   ```

4. **Atualizar Email Templates**
   - Confirm Signup
   - Reset Password
   - Magic Link

### Template de Email Atualizado
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ .SiteName }} - Confirmação de Cadastro</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">{{ .SiteName }}</h1>
        <p style="color: white; margin: 10px 0 0 0;">Bem-vindo ao futuro da análise NCM</p>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Confirme seu cadastro</h2>
        
        <p style="color: #666; line-height: 1.6;">Olá! Obrigado por se cadastrar no {{ .SiteName }}. Para ativar sua conta e começar a usar nossa plataforma, clique no botão abaixo:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Confirmar Cadastro</a>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="color: #667eea; font-size: 14px; word-break: break-all;">{{ .ConfirmationURL }}</p>
        
        <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">Este email foi enviado para {{ .Email }}. Se você não se cadastrou no {{ .SiteName }}, pode ignorar este email.</p>
    </div>
</body>
</html>
```

## Script para Verificar Configuração

```javascript
// test-resend-domain.js
const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testDomainConfig() {
  try {
    // Listar domínios verificados
    const domains = await resend.domains.list();
    console.log('Domínios verificados:', domains);
    
    // Testar envio com domínio verificado
    const result = await resend.emails.send({
      from: 'NCM Analyzer Pro <noreply@seudominio.com>',
      to: ['gamepathai@gmail.com'], // Use seu email para teste
      subject: 'Teste de Domínio Verificado',
      html: '<h2>Teste de configuração</h2><p>Se você recebeu este email, o domínio está configurado corretamente!</p>'
    });
    
    console.log('Email enviado:', result);
  } catch (error) {
    console.error('Erro:', error);
  }
}

testDomainConfig();
```

## Próximos Passos

### Imediato (Para Continuar Desenvolvimento)
1. ✅ Use `gamepathai@gmail.com` como email de teste
2. ✅ Configure `from: "NCM Analyzer Pro" <noreply@resend.dev>`
3. ✅ Teste o fluxo completo de cadastro

### Para Produção
1. 🔄 Registre um domínio próprio
2. 🔄 Configure DNS no Resend
3. 🔄 Atualize templates de email
4. 🔄 Teste com emails reais

## Comandos Úteis

```bash
# Testar configuração atual
node test-resend-domain.js

# Verificar domínios no Resend
node list-domains-resend.js

# Testar SMTP do Supabase
node test-supabase-smtp.js
```

## Troubleshooting

### Erro: "Domain not verified"
- Verifique se os registros DNS foram propagados
- Aguarde até 24h para propagação completa
- Use ferramentas como `dig` ou `nslookup` para verificar

### Erro: "Invalid from address"
- Certifique-se de usar um email do domínio verificado
- Formato correto: `"Nome" <email@dominio.com>`

### Emails não chegam
- Verifique spam/lixo eletrônico
- Confirme se o domínio está realmente verificado
- Teste com diferentes provedores de email