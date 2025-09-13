-- Script para verificar se a tabela user_profiles existe
-- Execute no SQL Editor do Supabase

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_profiles'
) as tabela_existe;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Verificar RLS na tabela
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Verificar políticas RLS
SELECT policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';