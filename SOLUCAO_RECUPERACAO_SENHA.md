# 🔧 Solução: Recuperação de Senha Não Funciona

## 🔍 Problema Identificado

O sistema de recuperação de senha está retornando "sucesso" na interface, mas não está enviando emails. O problema é que **a tabela `password_reset_tokens` não existe** no banco de dados.

## ✅ Solução Completa

### 1. Criar a Tabela no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/sql
2. Cole o SQL abaixo e execute:

```sql
-- Criar tabela para tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Habilitar RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Allow insert password reset tokens" ON password_reset_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read password reset tokens" ON password_reset_tokens
  FOR SELECT USING (true);

CREATE POLICY "Allow update password reset tokens" ON password_reset_tokens
  FOR UPDATE USING (true);

-- Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION clean_expired_password_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Configurar SMTP no Supabase

1. Vá para: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/settings/auth
2. Na seção "SMTP Settings", configure:
   - **Host**: `smtp.resend.com`
   - **Port**: `587`
   - **Username**: `resend`
   - **Password**: `re_cUYtKFVN_PKKTwpTDy81aaDFZNWKmwYsz`
   - **Sender email**: `noreply@gamepathai.com`
   - **Sender name**: `NCM Analyzer Pro`

### 3. Verificar Configuração

Após executar o SQL, teste novamente:

```bash
node test-password-recovery-simple.cjs
```

## 🔄 Fluxo Correto Após Correção

1. **Usuário solicita recuperação** → Frontend chama função Edge
2. **Função verifica usuário** → Busca na tabela `auth.users`
3. **Gera token seguro** → Salva na tabela `password_reset_tokens`
4. **Envia email via Resend** → Usando configuração SMTP
5. **Usuário recebe email** → Com link para redefinir senha
6. **Clica no link** → Valida token e permite nova senha

## 🚨 Problemas Identificados

### ❌ Antes da Correção:
- Tabela `password_reset_tokens` não existia
- Função falhava ao tentar salvar token
- Retornava "sucesso" por segurança, mas não enviava email
- SMTP não configurado no Supabase

### ✅ Após a Correção:
- Tabela criada com todas as colunas necessárias
- RLS configurado corretamente
- Índices para performance
- SMTP configurado com Resend
- Emails serão enviados corretamente

## 🧪 Teste Final

Após aplicar as correções:

1. Acesse a página de recuperação de senha
2. Digite um email válido (que existe no sistema)
3. Verifique se o email chegou na caixa de entrada
4. Clique no link e redefina a senha

## 📝 Arquivos Relacionados

- `supabase/functions/password-recovery/index.ts` - Função Edge principal
- `src/pages/ForgotPasswordPage.tsx` - Interface de recuperação
- `src/pages/ResetPasswordPage.tsx` - Interface de redefinição
- `EXECUTAR_NO_SUPABASE_DASHBOARD.sql` - SQL para criar tabela

## 🎯 Status

- [x] Problema identificado
- [x] Solução documentada
- [ ] **PENDENTE**: Executar SQL no Supabase Dashboard
- [ ] **PENDENTE**: Configurar SMTP no Supabase
- [ ] **PENDENTE**: Testar fluxo completo

---

**Próximo passo**: Execute o SQL no Supabase Dashboard para criar a tabela e configure o SMTP.