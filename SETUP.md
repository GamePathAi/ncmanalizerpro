# 🚗 NCM Analyzer Pro - Setup Guide

Guia completo para configurar o sistema de autenticação e pagamentos do NCM Analyzer Pro.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- Conta no [Stripe](https://stripe.com)
- Git instalado

## 🗄️ Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em "New Project"
3. Escolha sua organização
4. Defina:
   - **Name**: `ncm-analyzer-pro`
   - **Database Password**: (anote esta senha)
   - **Region**: `South America (São Paulo)`
5. Clique em "Create new project"

### 2. Configurar Tabelas do Banco

No painel do Supabase, vá em **SQL Editor** e execute os seguintes comandos:

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis de usuário
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    subscription_type TEXT CHECK (subscription_type IN ('annual', 'lifetime')),
    subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'pending')) DEFAULT 'pending',
    subscription_id TEXT,
    customer_id TEXT,
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT,
    stripe_session_id TEXT,
    amount INTEGER, -- em centavos
    currency TEXT DEFAULT 'brl',
    status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    subscription_type TEXT CHECK (subscription_type IN ('annual', 'lifetime')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### 3. Configurar Row Level Security (RLS)

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4. Obter Chaves do Supabase

1. No painel do Supabase, vá em **Settings** > **API**
2. Copie:
   - **Project URL**
   - **anon public key**

## 💳 Configuração do Stripe

### 1. Configurar Produtos no Stripe

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Vá em **Products** > **Add product**

**Produto 1: Assinatura Anual**
- **Name**: `NCM Analyzer Pro - Anual`
- **Description**: `Acesso completo ao analisador de NCMs por 1 ano`
- **Pricing**: `Recurring` > `Annual` > `R$ 997,00`
- Anote o **Price ID** gerado

**Produto 2: Pagamento Vitalício**
- **Name**: `NCM Analyzer Pro - Vitalício`
- **Description**: `Acesso vitalício ao analisador de NCMs`
- **Pricing**: `One time` > `R$ 2.997,00`
- Anote o **Price ID** gerado

### 2. Configurar Webhook

1. Vá em **Developers** > **Webhooks** > **Add endpoint**
2. **Endpoint URL**: `https://seu-dominio.com/api/stripe/webhook`
3. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Anote o **Webhook Secret**

### 3. Obter Chaves do Stripe

1. Vá em **Developers** > **API keys**
2. Copie:
   - **Publishable key**
   - **Secret key**

## ⚙️ Configuração do Projeto

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas chaves:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui

# Produtos Stripe
VITE_STRIPE_ANNUAL_PRICE_ID=price_seu_id_anual
VITE_STRIPE_LIFETIME_PRICE_ID=price_seu_id_vitalicio

# App
VITE_APP_NAME=NCM Analyzer Pro
VITE_APP_URL=http://localhost:5173
```

### 3. Executar o Projeto

```bash
npm run dev
```

## 🔧 Funcionalidades Implementadas

### ✅ Autenticação
- [x] Registro de usuários
- [x] Login/Logout
- [x] Recuperação de senha
- [x] Perfil de usuário

### ✅ Pagamentos
- [x] Integração com Stripe Checkout
- [x] Planos Anual e Vitalício
- [x] Redirecionamento pós-pagamento
- [x] Verificação de status de assinatura

### ✅ Interface
- [x] Página de preços
- [x] Dashboard do usuário
- [x] Proteção de rotas por assinatura
- [x] Tema automotivo consistente

### ⏳ Próximos Passos
- [ ] Webhook do Stripe para atualizar status
- [ ] Página de sucesso/erro de pagamento
- [ ] Histórico de transações
- [ ] Cancelamento de assinatura
- [ ] Notificações por email

## 🚨 Troubleshooting

### Erro de CORS no Supabase
1. Vá em **Authentication** > **Settings**
2. Em **Site URL**, adicione: `http://localhost:5173`
3. Em **Redirect URLs**, adicione: `http://localhost:5173/**`

### Erro no Stripe Checkout
1. Verifique se as chaves estão corretas no `.env`
2. Confirme se os Price IDs estão corretos
3. Teste com dados de cartão de teste do Stripe

### Problemas de Autenticação
1. Verifique se o RLS está configurado corretamente
2. Confirme se as políticas de segurança estão ativas
3. Teste com um usuário recém-criado

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console do navegador
2. Consulte a documentação do [Supabase](https://supabase.com/docs)
3. Consulte a documentação do [Stripe](https://stripe.com/docs)

---

**🚗 NCM Analyzer Pro** - Economize milhares em suas importações automotivas!