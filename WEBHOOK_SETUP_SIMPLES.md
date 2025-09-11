# Setup Simples do Webhook de Email

## Passo a Passo Rápido

### 1. Configurar Variáveis no Supabase

No dashboard do Supabase, vá em **Settings > Edge Functions** e adicione:

```
RESEND_API_KEY=re_xxxxxxxxxx
FROM_EMAIL=noreply@seudominio.com
FROM_NAME=NCM Pro
APP_URL=https://seuapp.com
```

### 2. Executar o Script SQL

1. Abra o **SQL Editor** no dashboard do Supabase
2. Cole o conteúdo do arquivo `setup-email-webhook.sql`
3. **ANTES DE EXECUTAR**, substitua:
   - `your-app-domain.com` → sua URL real
   - `your-project-ref` → referência do seu projeto
   - `YOUR_ANON_KEY` → sua chave anônima
4. Execute o script

### 3. Testar o Webhook

```bash
node test-webhook-simple.js
```

### 4. Verificar Logs

No dashboard do Supabase:
- **Edge Functions > send-confirmation-email > Logs**
- **Database > Logs**

## Troubleshooting Rápido

### ❌ Erro "extension http does not exist"
**Solução:** Execute no SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS http;
```

### ❌ Erro "function does not exist"
**Solução:** Verifique se o script SQL foi executado completamente

### ❌ Webhook não dispara
**Solução:** Verifique se o trigger foi criado:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### ❌ Edge Function retorna erro
**Solução:** Verifique as variáveis de ambiente no Supabase

## Estrutura Final

```
Usuário se registra → Trigger dispara → Função SQL → Edge Function → Resend → Email enviado
```

## Comandos Úteis

```bash
# Deploy da função
supabase functions deploy send-confirmation-email

# Verificar secrets
supabase secrets list

# Testar localmente
node test-webhook-simple.js
```

---

**✅ Pronto!** O webhook deve estar funcionando. Qualquer usuário que se registrar receberá automaticamente o email de confirmação.