# Configuração do Webhook do Resend - Guia Completo

## 🎯 Objetivo

Configurar o webhook do Resend para receber eventos de email (entrega, abertura, cliques, etc.) e armazenar estatísticas no banco de dados.

## 🔑 Token do Webhook

**Token fornecido:** `whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo`

## 📋 Passo a Passo

### 1. Executar o SQL de Configuração

1. Abra o **SQL Editor** no dashboard do Supabase
2. Cole o conteúdo do arquivo `setup-resend-webhook.sql`
3. Execute o script

Este script irá:
- ✅ Criar a tabela `email_logs` para armazenar estatísticas
- ✅ Configurar índices e políticas de segurança
- ✅ Atualizar a função de envio de email para salvar logs

### 2. Deploy da Edge Function

```bash
# No terminal, dentro da pasta do projeto
cd ncmpro-app

# Deploy da função do webhook
supabase functions deploy resend-webhook
```

### 3. Configurar Webhook no Dashboard do Resend

1. Acesse o [dashboard do Resend](https://resend.com/webhooks)
2. Clique em **"Add Webhook"**
3. Configure:
   - **URL:** `https://fsntzljufghutoyqxokm.supabase.co/functions/v1/resend-webhook`
   - **Secret:** `whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo`
   - **Eventos selecionados:**
     - ✅ `email.sent`
     - ✅ `email.delivered`
     - ✅ `email.delivery_delayed`
     - ✅ `email.complained`
     - ✅ `email.bounced`
     - ✅ `email.opened`
     - ✅ `email.clicked`

### 4. Testar a Configuração

```bash
# Testar o webhook
node test-resend-webhook.js
```

## 📊 Funcionalidades Implementadas

### Eventos Suportados

| Evento | Descrição | Dados Salvos |
|--------|-----------|-------------|
| `email.sent` | Email enviado com sucesso | `sent_at`, `status: 'sent'` |
| `email.delivered` | Email entregue ao destinatário | `delivered_at`, `status: 'delivered'` |
| `email.delivery_delayed` | Entrega atrasada | `delayed_at`, `status: 'delayed'` |
| `email.complained` | Marcado como spam | `complained_at`, `status: 'complained'` |
| `email.bounced` | Email rejeitado | `bounced_at`, `bounce_reason`, `status: 'bounced'` |
| `email.opened` | Email aberto pelo usuário | `opened_at`, `open_count++` |
| `email.clicked` | Link clicado no email | `clicked_at`, `click_count++`, `last_clicked_url` |

### Tabela email_logs

```sql
CREATE TABLE email_logs (
    id UUID PRIMARY KEY,
    email_id TEXT UNIQUE NOT NULL,  -- ID do Resend
    email TEXT NOT NULL,
    subject TEXT,
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    delayed_at TIMESTAMPTZ,
    complained_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_reason TEXT,
    opened_at TIMESTAMPTZ,
    open_count INTEGER DEFAULT 0,
    clicked_at TIMESTAMPTZ,
    click_count INTEGER DEFAULT 0,
    last_clicked_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔍 Monitoramento

### Verificar Logs no Supabase

```sql
-- Ver todos os emails enviados
SELECT * FROM email_logs ORDER BY created_at DESC;

-- Ver estatísticas de entrega
SELECT 
    status,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM email_logs 
GROUP BY status;

-- Ver emails com maior engajamento
SELECT 
    email,
    subject,
    open_count,
    click_count,
    status
FROM email_logs 
WHERE open_count > 0 OR click_count > 0
ORDER BY (open_count + click_count) DESC;
```

### Logs da Edge Function

```bash
# Ver logs em tempo real
supabase functions logs resend-webhook
```

## 🐛 Troubleshooting

### ❌ Webhook não está recebendo eventos

**Possíveis causas:**
1. Edge Function não foi deployada
2. URL incorreta no dashboard do Resend
3. Secret incorreto
4. Eventos não selecionados no Resend

**Soluções:**
```bash
# Redeploy da função
supabase functions deploy resend-webhook

# Verificar logs
supabase functions logs resend-webhook

# Testar manualmente
node test-resend-webhook.js
```

### ❌ Erro "Table email_logs doesn't exist"

**Solução:**
1. Execute o SQL `setup-resend-webhook.sql` no dashboard do Supabase
2. Verifique se a tabela foi criada: `SELECT * FROM email_logs LIMIT 1;`

### ❌ Erro de permissão na tabela

**Solução:**
```sql
-- Conceder permissões
GRANT ALL ON email_logs TO service_role;
GRANT SELECT ON email_logs TO authenticated;
```

### ❌ Assinatura inválida

**Verificações:**
1. Secret correto no dashboard do Resend
2. Headers `resend-signature` e `resend-timestamp` presentes
3. Implementação da verificação de assinatura

## 📈 Próximos Passos

### Melhorias Futuras

1. **Dashboard de Analytics**
   - Criar página para visualizar estatísticas
   - Gráficos de taxa de entrega, abertura e cliques
   - Relatórios por período

2. **Alertas Automáticos**
   - Notificar quando taxa de bounce for alta
   - Alertar sobre reclamações de spam
   - Monitorar emails não entregues

3. **Segmentação**
   - Categorizar emails por tipo (confirmação, marketing, etc.)
   - Análise de performance por segmento
   - A/B testing de templates

4. **Integração com Frontend**
   - Mostrar status de entrega na interface
   - Reenvio automático de emails não entregues
   - Histórico de emails por usuário

## ✅ Checklist de Configuração

- [ ] SQL `setup-resend-webhook.sql` executado
- [ ] Edge Function `resend-webhook` deployada
- [ ] Webhook configurado no dashboard do Resend
- [ ] URL correta: `https://fsntzljufghutoyqxokm.supabase.co/functions/v1/resend-webhook`
- [ ] Secret correto: `whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo`
- [ ] Eventos selecionados no Resend
- [ ] Teste executado: `node test-resend-webhook.js`
- [ ] Logs verificados no Supabase

---

🎉 **Configuração concluída!** O webhook do Resend está pronto para receber e processar eventos de email.