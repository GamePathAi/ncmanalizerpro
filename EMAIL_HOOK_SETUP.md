# Configuração do Email Hook no Supabase

Este guia explica como configurar o sistema de email automático que envia emails de boas-vindas quando um usuário se registra.

## 📋 Pré-requisitos

1. Projeto Supabase configurado
2. Supabase CLI instalado
3. Conta no Resend (ou outro provedor de email)
4. Schema do banco de dados aplicado

## 🚀 Passo a Passo

### 1. Configurar Variáveis de Ambiente

No seu projeto Supabase, configure as seguintes variáveis:

```bash
# No dashboard do Supabase, vá em Settings > Edge Functions
# Adicione estas variáveis de ambiente:

RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@seudominio.com
FROM_NAME=NCM Analyzer Pro
APP_URL=https://seudominio.com
```

### 2. Habilitar Extensão HTTP

No SQL Editor do Supabase, execute:

```sql
-- Habilitar extensão para fazer requisições HTTP
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Configurar variáveis do sistema (substitua pelos seus valores)
ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'https://seu-projeto.supabase.co';
ALTER DATABASE postgres SET "app.settings.supabase_anon_key" TO 'sua-anon-key';
```

### 3. Deploy da Edge Function

```bash
# No terminal, dentro da pasta do projeto
cd ncmpro-app

# Login no Supabase (se ainda não fez)
supabase login

# Link com seu projeto
supabase link --project-ref seu-project-id

# Deploy da função
supabase functions deploy send-welcome-email
```

### 4. Aplicar Schema do Banco

Execute o arquivo `database_schema.sql` no SQL Editor do Supabase.

### 5. Testar a Configuração

#### Teste Manual da Edge Function:

```bash
# Teste local (opcional)
supabase functions serve send-welcome-email

# Em outro terminal, teste:
curl -X POST 'http://localhost:54321/functions/v1/send-welcome-email' \
  -H 'Authorization: Bearer sua-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "teste@exemplo.com",
    "name": "Usuário Teste"
  }'
```

#### Teste do Trigger:

1. Registre um novo usuário no seu aplicativo
2. Verifique os logs da Edge Function no dashboard do Supabase
3. Confirme se o email foi enviado

## 🔧 Configuração do Resend

### 1. Criar Conta no Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Verifique seu domínio (ou use o domínio de teste)

### 2. Obter API Key

1. No dashboard do Resend, vá em "API Keys"
2. Clique em "Create API Key"
3. Copie a chave gerada
4. Adicione como variável de ambiente no Supabase

### 3. Configurar Domínio (Produção)

```bash
# Para produção, configure seu domínio no Resend
# Adicione os registros DNS necessários
# Verifique o domínio no dashboard
```

## 📧 Personalizar Template de Email

O template está no arquivo `supabase/functions/send-welcome-email/index.ts`.

Você pode personalizar:
- Cores e estilos
- Conteúdo do texto
- Links e botões
- Imagens (adicione URLs completas)

## 🐛 Troubleshooting

### Erro: "Extension http not found"
```sql
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

### Erro: "Function not found"
```bash
# Redeploy da função
supabase functions deploy send-welcome-email --no-verify-jwt
```

### Email não está sendo enviado
1. Verifique os logs da Edge Function
2. Confirme se a RESEND_API_KEY está configurada
3. Verifique se o domínio está verificado no Resend

### Trigger não está funcionando
```sql
-- Verificar se o trigger existe
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'send_welcome_email_on_signup';

-- Recriar se necessário
DROP TRIGGER IF EXISTS send_welcome_email_on_signup ON auth.users;
CREATE TRIGGER send_welcome_email_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.send_welcome_email_trigger();
```

## 📊 Monitoramento

### Logs da Edge Function
```bash
# Ver logs em tempo real
supabase functions logs send-welcome-email
```

### Métricas no Dashboard
- Acesse o dashboard do Supabase
- Vá em "Edge Functions"
- Clique em "send-welcome-email"
- Veja invocações, erros e latência

## 🔒 Segurança

- A função usa `SECURITY DEFINER` para executar com privilégios elevados
- As credenciais ficam seguras nas variáveis de ambiente
- O trigger só é executado em inserções na tabela `auth.users`

## 💡 Próximos Passos

1. **Emails Transacionais**: Adicionar emails para reset de senha, confirmação, etc.
2. **Templates Avançados**: Usar um sistema de templates mais robusto
3. **Analytics**: Rastrear abertura e cliques nos emails
4. **Personalização**: Emails baseados no tipo de assinatura do usuário

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no dashboard do Supabase
2. Teste a função manualmente
3. Confirme as configurações de ambiente
4. Verifique a documentação do Resend

---

✅ **Configuração concluída!** Agora seus usuários receberão emails de boas-vindas automaticamente ao se registrarem.