# 🚀 Guia de Execução Manual - Supabase Database Setup

## 📋 Situação Atual

Baseado na análise do seu banco de dados, identifiquei que:

❌ **A tabela `password_reset_tokens` NÃO EXISTE**  
❌ **O banco parece estar em estado inicial/vazio**  
❌ **Não há funções RPC configuradas**  

## 🎯 O que precisa ser feito

### 1. Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `fsntzljufghutoyqxokm`
4. Vá para **SQL Editor** (ícone de banco de dados na lateral)

### 2. Executar o SQL de Criação da Tabela

Cole e execute o seguinte SQL no SQL Editor:

```sql
-- Criar tabela para tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_created_at ON password_reset_tokens(created_at);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_password_reset_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_password_reset_tokens_updated_at
    BEFORE UPDATE ON password_reset_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_password_reset_tokens_updated_at();

-- Criar função para limpeza automática de tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Política de segurança RLS (Row Level Security)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir que apenas o service role acesse
CREATE POLICY "Service role can manage password reset tokens" ON password_reset_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Comentários para documentação
COMMENT ON TABLE password_reset_tokens IS 'Tabela para armazenar tokens de recuperação de senha';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'ID do usuário que solicitou a recuperação';
COMMENT ON COLUMN password_reset_tokens.email IS 'Email do usuário (para auditoria)';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único para recuperação';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data/hora de expiração do token';
COMMENT ON COLUMN password_reset_tokens.used IS 'Se o token já foi utilizado';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Data/hora em que o token foi utilizado';
```

### 3. Verificar se foi criado corretamente

Após executar o SQL acima, execute este comando para verificar:

```sql
-- Verificar se a tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'password_reset_tokens';

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'password_reset_tokens'
ORDER BY ordinal_position;
```

### 4. Verificar outras tabelas necessárias

Também execute este comando para ver todas as tabelas do seu projeto:

```sql
-- Listar todas as tabelas públicas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

## 🔍 Possíveis Problemas Identificados

### 1. **Inconsistência nas Chaves do .env**

No seu arquivo `.env`, há uma inconsistência:
- `VITE_SUPABASE_URL` aponta para: `fsntzljufghutoyqxokm.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` parece ser de outro projeto: `abxubuocnmuiojinevy`

**Solução:** Verifique no Supabase Dashboard se as chaves estão corretas.

### 2. **Banco de Dados Vazio**

O banco parece estar em estado inicial. Você pode precisar:
- Configurar autenticação
- Criar outras tabelas necessárias
- Configurar políticas RLS

## ✅ Próximos Passos

1. **Execute o SQL manual no Dashboard**
2. **Verifique se a tabela foi criada**
3. **Teste a recuperação de senha**
4. **Configure SMTP no Supabase** (se ainda não foi feito)

## 🆘 Se ainda houver problemas

Se após executar o SQL manual ainda houver erros:

1. Verifique se você está no projeto correto no Dashboard
2. Confirme se as chaves API no `.env` estão corretas
3. Verifique se o projeto Supabase tem autenticação habilitada
4. Entre em contato com o suporte do Supabase se necessário

---

**📝 Nota:** Este guia resolve especificamente a criação da tabela `password_reset_tokens`. Após isso, o sistema de recuperação de senha deve funcionar corretamente.