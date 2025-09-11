# 🎯 Configuração Final do Webhook Resend

## ✅ Status Atual
- ✅ Edge Function `resend-webhook` deployada com sucesso
- ✅ Token do webhook configurado: `whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo`
- ⚠️ Tabela `email_logs` precisa ser criada no banco de dados

## 🚀 Passos Finais para Completar a Configuração

### 1. Criar Tabela no Banco de Dados

**Execute o SQL abaixo no Dashboard do Supabase:**

1. Acesse: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm
2. Vá em "SQL Editor"
3. Cole e execute o conteúdo do arquivo `create-email-logs-table.sql`

Ou execute este SQL diretamente:

```sql
-- Criar tabela email_logs
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_email_logs_email_id ON email_logs(email_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Configurar RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON email_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Configurar Webhook no Dashboard do Resend

1. Acesse: https://resend.com/webhooks
2. Clique em "Add Webhook"
3. Configure:
   - **URL**: `https://fsntzljufghutoyqxokm.supabase.co/functions/v1/resend-webhook`
   - **Secret**: `whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo`
   - **Eventos**:
     - ✅ `email.sent`
     - ✅ `email.delivered`
     - ✅ `email.bounced`
     - ✅ `email.opened`
     - ✅ `email.clicked`
     - ✅ `email.complained`
     - ✅ `email.delivery_delayed`

### 3. Testar a Configuração

Após executar o SQL, teste novamente:

```bash
node test-resend-webhook.js
```

### 4. Monitorar Logs

Para monitorar os logs da Edge Function:

```bash
supabase functions logs resend-webhook
```

### 5. Verificar Dados no Banco

Para ver os logs de email no banco:

```sql
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;
```

## 🔧 Funcionalidades do Webhook

### Eventos Suportados:
- **email.sent**: Email enviado com sucesso
- **email.delivered**: Email entregue ao destinatário
- **email.bounced**: Email rejeitado (bounce)
- **email.opened**: Email aberto pelo destinatário
- **email.clicked**: Link no email clicado
- **email.complained**: Email marcado como spam
- **email.delivery_delayed**: Entrega atrasada

### Dados Armazenados:
- ID único do email
- Endereço de email do destinatário
- Assunto do email
- Status atual (sent, delivered, bounced, etc.)
- Timestamps de cada evento
- Contadores de abertura e cliques
- Razão do bounce (se aplicável)
- URL do último clique

## 🚨 Troubleshooting

### Se o webhook não funcionar:

1. **Verificar Edge Function**:
   ```bash
   supabase functions logs resend-webhook --follow
   ```

2. **Testar manualmente**:
   ```bash
   curl -X POST https://fsntzljufghutoyqxokm.supabase.co/functions/v1/resend-webhook \
     -H "Content-Type: application/json" \
     -H "resend-signature: whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo" \
     -H "resend-timestamp: $(date +%s)" \
     -d '{"type":"email.sent","data":{"email_id":"test-123","to":["test@example.com"],"subject":"Test"}}'
   ```

3. **Verificar variáveis de ambiente**:
   - No dashboard do Supabase, vá em Settings > Edge Functions
   - Confirme que as variáveis estão configuradas

4. **Verificar tabela**:
   ```sql
   SELECT COUNT(*) FROM email_logs;
   ```

## 📊 Monitoramento

### Queries Úteis:

```sql
-- Estatísticas gerais
SELECT 
    status,
    COUNT(*) as total,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM email_logs 
GROUP BY status;

-- Emails recentes
SELECT 
    email,
    subject,
    status,
    created_at,
    sent_at,
    delivered_at
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- Taxa de abertura
SELECT 
    COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as open_rate
FROM email_logs 
WHERE status = 'delivered';
```

## 🎉 Próximos Passos

1. ✅ Execute o SQL para criar a tabela
2. ✅ Configure o webhook no Resend
3. ✅ Teste enviando um email real
4. ✅ Monitore os logs e dados
5. ✅ Implemente dashboards de analytics (opcional)

---

**🔗 Links Importantes:**
- Dashboard Supabase: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm
- Dashboard Resend: https://resend.com/webhooks
- Edge Function URL: https://fsntzljufghutoyqxokm.supabase.co/functions/v1/resend-webhook

**🔑 Token do Webhook:** `whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo`