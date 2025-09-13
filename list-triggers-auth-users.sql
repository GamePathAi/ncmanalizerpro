-- Script para listar triggers na tabela auth.users

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

-- Também lista as funções associadas aos triggers
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM 
    pg_proc p
JOIN 
    pg_trigger t ON p.oid = t.tgrelid
WHERE 
    t.tgrelid = 'auth.users'::regclass;