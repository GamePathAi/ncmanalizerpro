# 🚨 GUIA URGENTE: Corrigir Erro de Cadastro

## ❌ Problema Identificado

O erro "Database error saving new user" está acontecendo porque:

1. **Função `handle_new_user` não existe** - Esta função é essencial para criar o perfil do usuário
2. **Políticas RLS mal configuradas** - Impedindo inserções na tabela `user_profiles`
3. **Trigger `on_auth_user_created` não existe** - Não executa a função quando um usuário se cadastra

## 🔧 SOLUÇÃO IMEDIATA

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **fsntzljufghutoyqxokm**

### Passo 2: Abrir o SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**

### Passo 3: Executar o Script SQL

1. **COPIE TODO O CONTEÚDO** do arquivo `fix-database-schema.sql`
2. **COLE** no SQL Editor
3. Clique em **"Run"** (botão azul)

### Passo 4: Verificar Execução

Após executar, você deve ver uma tabela com:

```
object_type                    | status
-------------------------------|----------
user_profiles table           | ✅ Created
handle_new_user function      | ✅ Created
on_auth_user_created trigger  | ✅ Created
```

## 🧪 TESTE APÓS EXECUÇÃO

Após executar o script SQL:

1. **Volte para o terminal**
2. **Execute**: `node test-signup.js`
3. **Deve funcionar sem erros**

## 📋 CONTEÚDO DO SCRIPT (para referência)

O script `fix-database-schema.sql` faz:

- ✅ Remove configurações antigas (se existirem)
- ✅ Cria tabela `user_profiles` com estrutura correta
- ✅ Configura políticas RLS adequadas
- ✅ Cria função `handle_new_user` robusta
- ✅ Cria trigger `on_auth_user_created`
- ✅ Verifica se tudo foi criado corretamente

## 🚨 SE AINDA NÃO FUNCIONAR

Se após executar o script o erro persistir:

1. **Verifique os logs do Supabase**:
   - Dashboard → Logs → Database
   - Procure por erros relacionados ao trigger

2. **Execute novamente a verificação**:
   ```bash
   node verify-database-objects.js
   ```

3. **Teste o cadastro**:
   ```bash
   node test-signup.js
   ```

## 📞 PRÓXIMOS PASSOS

1. **Execute o script SQL no Dashboard**
2. **Teste o cadastro**
3. **Se funcionar, teste no navegador**: http://localhost:5173/
4. **Confirme que o cadastro está funcionando**

---

**⚡ IMPORTANTE**: O script SQL DEVE ser executado no Supabase Dashboard. Não há como executá-lo localmente pois precisa de privilégios administrativos do banco de dados.