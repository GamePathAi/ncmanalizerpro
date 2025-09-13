-- Script de diagnóstico para testar inserção manual de usuário e perfil
-- Execute este script no SQL Editor do Supabase para simular um cadastro e capturar erros detalhados

-- 1. Criar um usuário de teste na auth.users (simulando o que o Supabase faz)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'testuser@example.com',
    'dummy_password_hash',  -- Substitua por um hash real se necessário
    NULL,  -- Email não confirmado
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING id;  -- Isso deve acionar o trigger e tentar criar o perfil

-- 2. Se o INSERT acima falhar, o erro será mostrado aqui no editor
-- Verifique a mensagem de erro para detalhes sobre o problema na inserção do perfil

-- 3. Após executar, se bem-sucedido, verifique as tabelas:
SELECT * FROM auth.users WHERE email = 'testuser@example.com';
SELECT * FROM public.user_profiles WHERE email = 'testuser@example.com';

-- 4. Limpeza: Delete o usuário de teste se criado
-- DELETE FROM auth.users WHERE email = 'testuser@example.com';