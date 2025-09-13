-- Script para verificar a existência e configuração do trigger on_auth_user_created

-- Verificar se o trigger existe
SELECT 
    EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) AS trigger_exists;

-- Verificar se a função handle_new_user existe
SELECT 
    EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'handle_new_user'
    ) AS function_exists;

-- Obter definição da função handle_new_user se existir
SELECT 
    pg_get_functiondef(oid) 
FROM 
    pg_proc 
WHERE 
    proname = 'handle_new_user';

-- Verificar se o trigger está habilitado
SELECT 
    tgenabled 
FROM 
    pg_trigger 
WHERE 
    tgname = 'on_auth_user_created';

-- Verificar permissões RLS na tabela user_profiles
SELECT 
    tablename, 
    rowsecurity 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename = 'user_profiles';

-- Listar políticas RLS na tabela user_profiles
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM 
    pg_policies 
WHERE 
    schemaname = 'public' 
    AND tablename = 'user_profiles';