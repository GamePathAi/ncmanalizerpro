-- Script para verificar configurações da tabela auth.users

-- 1. Verificar se RLS está ativado na auth.users
SELECT 
    tablename, 
    rowsecurity 
FROM 
    pg_tables 
WHERE 
    schemaname = 'auth' 
    AND tablename = 'users';

-- 2. Verificar detalhes da coluna id (incluindo default)
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'id';

-- 3. Listar todas as constraints na auth.users
SELECT 
    constraint_name, 
    constraint_type, 
    table_name 
FROM 
    information_schema.table_constraints 
WHERE 
    table_schema = 'auth' 
    AND table_name = 'users';

-- 4. Listar todos os triggers na auth.users (para confirmação)
SELECT 
    trigger_schema, 
    trigger_name, 
    event_manipulation, 
    event_object_schema, 
    event_object_table, 
    action_statement, 
    action_timing, 
    action_orientation 
FROM 
    information_schema.triggers 
WHERE 
    event_object_schema = 'auth' 
    AND event_object_table = 'users' 
ORDER BY 
    trigger_name;

-- 5. Verificar definição da função handle_new_user
SELECT 
    pg_get_functiondef(oid) 
FROM 
    pg_proc 
WHERE 
    proname = 'handle_new_user';