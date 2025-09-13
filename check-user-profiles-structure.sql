-- Script para verificar a estrutura da tabela user_profiles
-- Execute este script no SQL Editor do Supabase para listar todas as colunas e tipos

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'user_profiles'
ORDER BY 
    ordinal_position;

-- Se a tabela não existir ou houver erro, isso será mostrado aqui