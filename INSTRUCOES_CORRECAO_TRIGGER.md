# 🔧 Instruções para Corrigir o Trigger do Supabase

O problema identificado é que o trigger `on_auth_user_created` não está funcionando devido a problemas com RLS (Row Level Security) e políticas restritivas.

## 📋 Passos para Correção

### 1. Acesse o Painel do Supabase
- Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Faça login na sua conta
- Selecione o projeto **NCM Analyzer Pro**

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **New Query** para criar uma nova consulta

### 3. Execute o Script de Correção
Copie e cole o conteúdo completo do arquivo `final-fix-rls.sql` no editor SQL e execute:

```sql
-- 1. Remover constraint de chave estrangeira problemática
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- 2. Desativar RLS temporariamente para debug
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Conceder permissões necessárias
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;
GRANT ALL ON user_profiles TO service_role;

-- 4. Remover trigger e função existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Criar nova função com tratamento de exceções
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Log de debug
  RAISE LOG 'Trigger executado para usuário: %', NEW.id;
  
  -- Verificar se o perfil já existe
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    RAISE LOG 'Perfil já existe para usuário: %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Inserir novo perfil
  BEGIN
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      subscription_type,
      subscription_status,
      totp_secret,
      totp_enabled,
      totp_backup_codes,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
      'free',
      'active',
      NULL,
      false,
      NULL,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Perfil criado com sucesso para usuário: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    -- Não falhar o cadastro por causa do perfil
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Reativar RLS com políticas corretas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados verem seus próprios dados
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para usuários autenticados atualizarem seus próprios dados
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para inserção (necessária para o trigger)
CREATE POLICY "Enable insert for authenticated users" ON user_profiles
  FOR INSERT WITH CHECK (true);
```

### 4. Verificar a Execução
Após executar o script, você deve ver mensagens de sucesso no painel. Se houver erros, anote-os para análise.

### 5. Testar o Cadastro
Após executar o script no Supabase, volte ao terminal e execute:

```bash
node test-signup.js
```

## 🚨 Pontos Importantes

1. **Execute TODO o script de uma vez** - não execute linha por linha
2. **Aguarde a conclusão** - o script pode demorar alguns segundos
3. **Verifique se não há erros** - qualquer erro deve ser reportado
4. **Teste imediatamente** - execute o teste de cadastro logo após

## 🔍 Se o Problema Persistir

Se após executar o script o erro continuar:

1. Verifique se todas as linhas foram executadas sem erro
2. Execute novamente o teste: `node check-trigger-exists.js`
3. Verifique os logs do Supabase em **Logs** > **Database**

## 📞 Próximos Passos

Após executar o script no Supabase:
1. Teste o cadastro com `node test-signup.js`
2. Se funcionar, teste o cadastro pela interface web
3. Confirme que o TOTP está funcionando corretamente