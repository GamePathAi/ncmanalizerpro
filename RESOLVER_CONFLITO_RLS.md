# 🔧 Resolver Conflito de Políticas RLS

## Problema Identificado
Erro: `policy "Service role can manage password reset tokens" for table "password_reset_tokens" already exists`

## Solução Manual no Supabase Dashboard

### Passo 1: Acessar o Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **fsntzljufghutoyqxokm**
4. Vá para **SQL Editor** no menu lateral

### Passo 2: Executar SQL de Correção
Copie e cole o SQL abaixo no SQL Editor:

```sql
-- 1. Remover políticas duplicadas (se existirem)
DROP POLICY IF EXISTS "Service role can manage password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can manage password reset tokens - select" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can manage password reset tokens - insert" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can manage password reset tokens - update" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can manage password reset tokens - delete" ON public.password_reset_tokens;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas separadas para service_role (recomendado)
CREATE POLICY "Service role select password reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
TO service_role 
USING (true);

CREATE POLICY "Service role insert password reset tokens" 
ON public.password_reset_tokens 
FOR INSERT 
TO service_role 
WITH CHECK (true);

CREATE POLICY "Service role update password reset tokens" 
ON public.password_reset_tokens 
FOR UPDATE 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role delete password reset tokens" 
ON public.password_reset_tokens 
FOR DELETE 
TO service_role 
USING (true);

-- 4. Criar políticas para usuários autenticados
CREATE POLICY "Users can view own password reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can create own password reset tokens" 
ON public.password_reset_tokens 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own password reset tokens" 
ON public.password_reset_tokens 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own password reset tokens" 
ON public.password_reset_tokens 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());
```

### Passo 3: Verificar Políticas Criadas
Execute este SQL para verificar se as políticas foram criadas:

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'password_reset_tokens'
ORDER BY policyname;
```

### Passo 4: Verificar se a Tabela Existe
Se houver erro de tabela não encontrada, execute primeiro:

```sql
-- Criar a tabela password_reset_tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Habilitar RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
```

## Resultado Esperado
Após executar o SQL acima, você deve ver:
- ✅ 8 políticas RLS criadas (4 para service_role + 4 para authenticated)
- ✅ Tabela password_reset_tokens com RLS habilitado
- ✅ Sem conflitos de políticas duplicadas

## Próximos Passos
1. ✅ Resolver conflito de políticas RLS (este guia)
2. 🔄 Testar sistema de autenticação
3. 🔄 Configurar SMTP no Supabase
4. 🔄 Testar envio de emails
5. 🔄 Configurar webhooks do Stripe

## Problemas Comuns

### Se a tabela não existir:
- Execute primeiro o SQL de criação da tabela (Passo 4)
- Depois execute o SQL de políticas (Passo 2)

### Se ainda houver erro de política duplicada:
- Execute apenas os comandos DROP POLICY primeiro
- Aguarde alguns segundos
- Execute os comandos CREATE POLICY

### Se não conseguir acessar o Dashboard:
- Verifique se está logado na conta correta
- Confirme o projeto: fsntzljufghutoyqxokm.supabase.co
- Use as credenciais do arquivo .env se necessário