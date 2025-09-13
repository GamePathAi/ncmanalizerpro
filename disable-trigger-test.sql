-- Script para desabilitar trigger temporariamente e testar
-- Execute no SQL Editor do Supabase

-- Desabilitar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verificar se foi desabilitado
SELECT 'Trigger desabilitado para teste!' as status;

-- Após testar, recrie o trigger se necessário com o script original