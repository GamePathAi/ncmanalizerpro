# Configuração do Supabase para NCM Analyzer Pro

## 1. Configuração Inicial

### Passo 1: Criar Projeto no Supabase
1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Crie um novo projeto ou use o existente
3. Anote a URL e a Anon Key do projeto

### Passo 2: Configurar Variáveis de Ambiente
Atualize o arquivo `.env` com suas credenciais:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

## 2. Executar Schema do Banco de Dados

### Opção 1: Via SQL Editor (Recomendado)
1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo `database_schema.sql`
4. Execute o script clicando em **Run**

### Opção 2: Via CLI do Supabase
```bash
# Instalar CLI do Supabase
npm install -g supabase

# Login no Supabase
supabase login

# Executar migrations
supabase db push
```

## 3. Verificar Configuração

### Tabelas Criadas
Após executar o script, você deve ter:
- ✅ `user_profiles` - Perfis de usuário
- ✅ `subscriptions` - Assinaturas do Stripe

### Políticas RLS
Verifique se as políticas de segurança foram criadas:
- ✅ Usuários podem ver apenas seus próprios dados
- ✅ Service role pode gerenciar assinaturas

### Triggers
Verifique se os triggers foram criados:
- ✅ Criação automática de perfil ao registrar usuário
- ✅ Atualização automática de `updated_at`

## 4. Configuração do Stripe (Opcional)

Para integração completa com pagamentos:

1. **Webhook do Stripe:**
   - Configure webhook para: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
   - Eventos necessários: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

2. **Variáveis de Ambiente:**
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## 5. Teste da Configuração

### Teste de Autenticação
1. Execute a aplicação: `npm run dev`
2. Acesse `http://localhost:5173`
3. Tente criar uma conta
4. Verifique se o perfil foi criado na tabela `user_profiles`

### Verificar no Supabase
1. Vá em **Table Editor**
2. Verifique a tabela `user_profiles`
3. Confirme se o usuário foi criado automaticamente

## 6. Troubleshooting

### Erro "Failed to fetch"
- ✅ Verifique se a URL do Supabase está correta
- ✅ Confirme se a Anon Key é válida
- ✅ Verifique se o projeto Supabase está ativo

### Erro de Permissão
- ✅ Confirme se as políticas RLS foram criadas
- ✅ Verifique se a autenticação está habilitada

### Tabelas não Criadas
- ✅ Execute o script `database_schema.sql` novamente
- ✅ Verifique se há erros no SQL Editor
- ✅ Confirme se as extensões foram habilitadas

## 7. Estrutura das Tabelas

### user_profiles
```sql
id UUID (PK, FK para auth.users)
email TEXT
full_name TEXT
subscription_type TEXT ('annual' | 'lifetime')
subscription_status TEXT ('active' | 'canceled' | 'pending')
subscription_id TEXT
customer_id TEXT
subscription_start_date TIMESTAMPTZ
subscription_end_date TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### subscriptions
```sql
id UUID (PK)
user_id UUID (FK para auth.users)
stripe_subscription_id TEXT (UNIQUE)
stripe_customer_id TEXT
status TEXT ('active' | 'canceled' | 'past_due' | 'unpaid')
plan_type TEXT ('annual' | 'lifetime')
current_period_start TIMESTAMPTZ
current_period_end TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## 8. Próximos Passos

Após configurar o banco:
1. ✅ Teste o sistema de autenticação
2. ✅ Configure integração com Stripe (se necessário)
3. ✅ Implemente lógica de assinatura
4. ✅ Teste fluxo completo de pagamento

---

**Nota:** Este setup é adequado tanto para desenvolvimento quanto para produção. Certifique-se de usar credenciais de produção quando fazer deploy da aplicação.