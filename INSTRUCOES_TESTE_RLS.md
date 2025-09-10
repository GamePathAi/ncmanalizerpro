# 🔧 Teste para Identificar Problema com RLS

## 🎯 Objetivo
Desativar temporariamente o RLS (Row Level Security) para confirmar se esse é o problema que impede o cadastro.

## 📋 Passos para Teste

### 1. Execute o Script de Desativação
1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá para SQL Editor
3. Copie e execute o conteúdo do arquivo `disable-rls-test.sql`

### 2. Teste o Cadastro
Após executar o script, rode:
```bash
node test-signup.js
```

### 3. Resultados Esperados

**Se o cadastro FUNCIONAR:**
- ✅ O problema é realmente o RLS
- Execute o script `final-fix-rls.sql` para corrigir definitivamente

**Se o cadastro CONTINUAR FALHANDO:**
- ❌ O problema não é o RLS
- Há outro problema na configuração do Supabase

### 4. Após o Teste
**IMPORTANTE:** Após identificar o problema, execute o script `final-fix-rls.sql` para reativar o RLS com as políticas corretas.

## ⚠️ Aviso
Este script desativa temporariamente a segurança da tabela. Use apenas para teste e reative o RLS imediatamente após.