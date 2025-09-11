# Configuração Final do Webhook Resend

## ✅ Status Atual

- **Edge Function**: `resend-webhook` está ATIVA (ID: 0316b326-891b-4691-af15-012b5e656dec)
- **Arquivos criados**: Todos os scripts e configurações estão prontos
- **Próximo passo**: Executar SQL manualmente no Supabase

## 🔧 Passo 1: Criar Tabela no Supabase

### Acesse o Dashboard do Supabase:
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute o SQL abaixo:

```sql
-- Criar tabela email_logs
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id TEXT UNIQUE,
    email TEXT NOT NULL,
    subject TEXT,
    status TEXT NOT NULL,
    event_type TEXT,
    timestamp TIMESTAMPTZ,
    bounce_reason TEXT,
    complaint_reason TEXT,
    delivery_delay INTEGER,
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

-- Criar políticas
DROP POLICY IF EXISTS "Allow service role full access" ON email_logs;
CREATE POLICY "Allow service role full access" ON email_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users read" ON email_logs;
CREATE POLICY "Allow authenticated users read" ON email_logs
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Criar função de timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger
DROP TRIGGER IF EXISTS update_email_logs_updated_at ON email_logs;
CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 🔗 Passo 2: Configurar Webhook no Resend

### URL do Webhook:
```
https://your-project-id.supabase.co/functions/v1/resend-webhook
```

### Configuração no Dashboard Resend:
1. Acesse https://resend.com/webhooks
2. Clique em "Add Webhook"
3. Cole a URL acima (substitua `your-project-id` pelo ID real do seu projeto)
4. Selecione os eventos:
   - `email.sent`
   - `email.delivered`
   - `email.bounced`
   - `email.complained`
   - `email.clicked`
5. Salve a configuração

## 🧪 Passo 3: Testar a Configuração

### Teste 1: Verificar Tabela
```sql
-- No SQL Editor do Supabase
SELECT * FROM email_logs LIMIT 5;
```

### Teste 2: Inserir Dados de Teste
```sql
INSERT INTO email_logs (email_id, email, subject, status, event_type)
VALUES ('test-123', 'teste@exemplo.com', 'Email de Teste', 'sent', 'email.sent');
```

### Teste 3: Executar Script de Teste
```bash
node test-resend-webhook.js
```

## 📊 Passo 4: Monitorar Logs

### Ver Logs da Edge Function:
```bash
supabase functions logs resend-webhook
```

### Consultar Logs de Email:
```sql
SELECT 
    email,
    subject,
    status,
    event_type,
    created_at
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔍 Troubleshooting

### Se a tabela não for criada:
1. Verifique se você tem permissões de admin no projeto
2. Tente executar o SQL em partes menores
3. Verifique se não há conflitos de nomes

### Se o webhook não funcionar:
1. Verifique se a URL está correta
2. Confirme se a Edge Function está ativa: `supabase functions list`
3. Verifique os logs: `supabase functions logs resend-webhook`

### Se houver erros de autenticação:
1. Verifique se as variáveis de ambiente estão configuradas
2. Confirme se o token do Resend está válido

## 📁 Arquivos Criados

- `supabase/functions/resend-webhook/index.ts` - Edge Function principal
- `setup-resend-webhook.sql` - SQL para configuração manual
- `test-resend-webhook.js` - Script de teste
- `setup-webhook-complete.js` - Script de configuração automática
- `create-table-direct.js` - Script alternativo
- `WEBHOOK_RESEND_FINAL.md` - Documentação anterior
- `CONFIGURACAO_FINAL_WEBHOOK.md` - Este guia

## ✅ Próximos Passos

1. **Execute o SQL** no dashboard do Supabase
2. **Configure o webhook** no dashboard do Resend
3. **Teste** enviando um email via Resend
4. **Monitore** os logs para confirmar funcionamento
5. **Integre** com sua aplicação principal

---

**Nota**: Após executar o SQL, a configuração estará completa e o webhook começará a funcionar automaticamente quando emails forem enviados via Resend.