# Instruções para Configurar o Supabase e Resolver o Erro 500

## Problema Identificado
O erro 500 no signup está ocorrendo porque:
1. O schema do banco de dados não foi aplicado corretamente
2. As configurações de email podem estar causando conflito

## Passos para Resolver:

### 1. Aplicar o Schema no Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm
2. Vá para **SQL Editor**
3. Copie e execute o conteúdo do arquivo `simple_schema.sql`
4. Clique em **Run** para executar o script

### 2. Verificar Configurações de Autenticação

1. Vá para **Authentication > Settings**
2. Verifique se **Enable email confirmations** está configurado corretamente
3. Se estiver habilitado, configure:
   - **Site URL**: `http://localhost:5173`
   - **Redirect URLs**: `http://localhost:5173/**`

### 3. Configurar Email (Opcional)

Se quiser habilitar confirmação de email:
1. Vá para **Authentication > Settings > SMTP Settings**
2. Configure um provedor de email (Gmail, SendGrid, etc.)
3. Ou use o serviço de email padrão do Supabase

### 4. Testar o Sistema

1. Volte para a aplicação: http://localhost:5173
2. Tente criar uma nova conta
3. Verifique se não há mais erro 500

## Arquivos Importantes:

- `simple_schema.sql` - Schema simplificado para aplicar no Supabase
- `src/lib/supabase.ts` - Configuração do cliente Supabase (temporariamente sem confirmação de email)

## Próximos Passos:

Após aplicar o schema e testar:
1. Reabilitar confirmação de email se necessário
2. Configurar adequadamente as URLs de redirecionamento
3. Testar fluxo completo de autenticação