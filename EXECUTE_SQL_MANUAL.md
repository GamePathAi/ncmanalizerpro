# 🔧 EXECUÇÃO MANUAL DO SQL NO SUPABASE DASHBOARD

## ⚠️ PROBLEMA IDENTIFICADO
O erro "Database error saving new user" persiste porque a função `handle_new_user()` e o trigger `on_auth_user_created` não estão funcionando corretamente, mesmo após as migrations.

## 📋 SOLUÇÃO: EXECUÇÃO MANUAL

### 1️⃣ Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Selecione o projeto: **NCManalizerPRO**
- Clique em **SQL Editor** no menu lateral

### 2️⃣ Execute o SQL Completo

Copie e cole o código abaixo no SQL Editor e clique em **RUN**:

```sql
-- ========================================
-- SCRIPT COMPLETO PARA CORRIGIR O TRIGGER
-- ========================================

-- 1. Limpar objetos existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Verificar estrutura da tabela user_profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Criar função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Log para debug
    RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
    
    -- Inserir perfil do usuário
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        subscription_type,
        subscription_status,
        trial_ends_at,
        created_at,
        updated_at,
        totp_secret,
        totp_enabled
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
        'free',
        'active',
        NOW() + INTERVAL '7 days',
        NOW(),
        NOW(),
        NULL,
        false
    );
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        -- Não falhar o cadastro se houver erro na criação do perfil
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar se foram criados corretamente
SELECT 
    'handle_new_user function' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

UNION ALL

SELECT 
    'on_auth_user_created trigger' as object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status

ORDER BY object_type;
```

### 3️⃣ Verificar Resultado
Após executar, você deve ver:
- ✅ handle_new_user function: Created
- ✅ on_auth_user_created trigger: Created

### 4️⃣ Testar o Cadastro
Após executar o SQL, teste o cadastro:

```bash
node test-signup.js
```

### 5️⃣ Verificar se Funcionou
Se o teste passou, verifique se o perfil foi criado:

```bash
node check-table-content.js
```

## 🚨 SE AINDA NÃO FUNCIONAR

Se o erro persistir, pode ser um problema de:

1. **Permissões**: A função precisa de `SECURITY DEFINER`
2. **Schema**: Verificar se a tabela `user_profiles` tem todas as colunas necessárias
3. **RLS (Row Level Security)**: Pode estar bloqueando a inserção

### Desabilitar RLS temporariamente:
```sql
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
```

### Verificar permissões:
```sql
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO anon;
```

## 📞 PRÓXIMOS PASSOS

1. Execute o SQL completo no Dashboard
2. Teste com `node test-signup.js`
3. Se funcionar: ✅ Problema resolvido!
4. Se não funcionar: Verifique RLS e permissões