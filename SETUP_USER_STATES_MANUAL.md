# Configuração Manual dos Estados de Usuário

## ✅ Status Atual
- Tabela `user_profiles` criada com sucesso
- Algumas funções precisam ser criadas manualmente

## 🔧 Próximos Passos

### 1. Executar SQL Restante no Supabase Dashboard

Acesse: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/sql

Execute o seguinte SQL:

```sql
-- Criar função para obter estado do usuário
CREATE OR REPLACE FUNCTION public.get_user_state(user_id UUID)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  subscription_status TEXT,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR,
  can_access_dashboard BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.subscription_status::TEXT,
    up.email_verified_at,
    up.stripe_customer_id,
    (up.subscription_status::TEXT = 'active') as can_access_dashboard
  FROM public.user_profiles up
  WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para atualizar status de assinatura
CREATE OR REPLACE FUNCTION public.update_subscription_status(
  user_email VARCHAR,
  customer_id VARCHAR,
  status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE public.user_profiles 
  SET 
    subscription_status = status::subscription_status_enum,
    stripe_customer_id = customer_id,
    updated_at = NOW()
  WHERE email = user_email;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_user_state(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_subscription_status(VARCHAR, VARCHAR, TEXT) TO anon, authenticated;
```

### 2. Verificar Estrutura

Execute para verificar:

```sql
-- Verificar tabela
SELECT * FROM public.user_profiles LIMIT 5;

-- Verificar enum
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscription_status_enum'::regtype;

-- Testar função
SELECT * FROM public.get_user_state('00000000-0000-0000-0000-000000000000');
```

## 🎯 Estados Implementados

1. **pending_email**: Usuário se cadastrou mas não confirmou email
   - Acesso: Apenas tela "Confirme seu email"
   - Ações: Reenviar email de confirmação

2. **pending_subscription**: Email confirmado mas sem assinatura
   - Acesso: Pode fazer login, vê apenas pricing/checkout
   - Ações: Assinar planos via Stripe

3. **active**: Email confirmado + assinatura ativa
   - Acesso: Dashboard completo liberado

## 📋 Próximas Implementações

1. ✅ Modelo de usuário com estados
2. ⏳ Middleware de autenticação
3. ⏳ Endpoints de autenticação
4. ⏳ Webhook do Stripe
5. ⏳ Roteamento protegido
6. ⏳ Telas específicas por estado
7. ⏳ Sistema de email
8. ⏳ Integração Stripe Checkout

## 🔍 Como Testar

Após executar o SQL manual:

```bash
node test-user-states.js
```

(Script será criado no próximo passo)