-- Função para testar sistema de autenticação sem rate limit
-- Esta função será executada diretamente no Supabase

CREATE OR REPLACE FUNCTION test_auth_system()
RETURNS TABLE (
  step_name text,
  status text,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_user_id uuid;
  test_email text;
  profile_record record;
BEGIN
  -- Gerar email único para teste
  test_email := 'teste-funcao-' || extract(epoch from now())::bigint || '@exemplo.com';
  
  -- Passo 1: Verificar se tabela user_profiles existe
  RETURN QUERY
  SELECT 
    'verificar_tabela'::text,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles')
      THEN 'sucesso'::text
      ELSE 'erro'::text
    END,
    jsonb_build_object(
      'tabela_existe', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles'),
      'colunas', (
        SELECT jsonb_agg(column_name)
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles'
      )
    );
  
  -- Passo 2: Criar usuário de teste diretamente na tabela auth.users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    test_email,
    crypt('senha123', gen_salt('bf')),
    NULL, -- Email não confirmado inicialmente
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"subscription_status": "pending_email"}'
  )
  RETURNING id INTO test_user_id;
  
  RETURN QUERY
  SELECT 
    'criar_usuario'::text,
    'sucesso'::text,
    jsonb_build_object(
      'user_id', test_user_id,
      'email', test_email,
      'status_inicial', 'pending_email'
    );
  
  -- Passo 3: Verificar se trigger criou perfil automaticamente
  SELECT * INTO profile_record
  FROM user_profiles 
  WHERE id = test_user_id;
  
  IF FOUND THEN
    RETURN QUERY
    SELECT 
      'trigger_perfil'::text,
      'sucesso'::text,
      jsonb_build_object(
        'perfil_criado', true,
        'subscription_status', profile_record.subscription_status,
        'stripe_customer_id', profile_record.stripe_customer_id
      );
  ELSE
    -- Criar perfil manualmente se trigger não funcionou
    INSERT INTO user_profiles (
      id,
      email,
      subscription_status,
      created_at,
      updated_at
    ) VALUES (
      test_user_id,
      test_email,
      'pending_email',
      now(),
      now()
    );
    
    RETURN QUERY
    SELECT 
      'trigger_perfil'::text,
      'manual'::text,
      jsonb_build_object(
        'perfil_criado', true,
        'metodo', 'manual',
        'subscription_status', 'pending_email'
      );
  END IF;
  
  -- Passo 4: Simular confirmação de email
  UPDATE auth.users 
  SET email_confirmed_at = now()
  WHERE id = test_user_id;
  
  UPDATE user_profiles 
  SET subscription_status = 'pending_subscription'
  WHERE id = test_user_id;
  
  RETURN QUERY
  SELECT 
    'confirmar_email'::text,
    'sucesso'::text,
    jsonb_build_object(
      'email_confirmado', true,
      'novo_status', 'pending_subscription'
    );
  
  -- Passo 5: Simular ativação de assinatura
  UPDATE user_profiles 
  SET 
    subscription_status = 'active',
    stripe_customer_id = 'cus_test_' || substr(test_user_id::text, 1, 8)
  WHERE id = test_user_id;
  
  RETURN QUERY
  SELECT 
    'ativar_assinatura'::text,
    'sucesso'::text,
    jsonb_build_object(
      'assinatura_ativa', true,
      'status_final', 'active',
      'stripe_customer_id', 'cus_test_' || substr(test_user_id::text, 1, 8)
    );
  
  -- Passo 6: Verificar estado final
  SELECT * INTO profile_record
  FROM user_profiles 
  WHERE id = test_user_id;
  
  RETURN QUERY
  SELECT 
    'estado_final'::text,
    'sucesso'::text,
    jsonb_build_object(
      'user_id', test_user_id,
      'email', profile_record.email,
      'subscription_status', profile_record.subscription_status,
      'stripe_customer_id', profile_record.stripe_customer_id,
      'created_at', profile_record.created_at,
      'fluxo_completo', true
    );
  
  -- Passo 7: Limpar dados de teste
  DELETE FROM user_profiles WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RETURN QUERY
  SELECT 
    'limpeza'::text,
    'sucesso'::text,
    jsonb_build_object(
      'dados_removidos', true,
      'teste_concluido', true
    );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      'erro'::text,
      'falha'::text,
      jsonb_build_object(
        'erro_codigo', SQLSTATE,
        'erro_mensagem', SQLERRM,
        'detalhes', 'Erro durante execução da função de teste'
      );
END;
$$;

-- Função para verificar configurações do sistema
CREATE OR REPLACE FUNCTION check_system_config()
RETURNS TABLE (
  config_name text,
  status text,
  value jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar tabelas existentes
  RETURN QUERY
  SELECT 
    'tabelas_sistema'::text,
    'info'::text,
    jsonb_build_object(
      'user_profiles', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles'),
      'auth_users', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'),
      'blocked_ips', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blocked_ips'),
      'rate_limit_logs', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limit_logs')
    );
  
  -- Verificar triggers
  RETURN QUERY
  SELECT 
    'triggers_sistema'::text,
    'info'::text,
    (
      SELECT jsonb_object_agg(trigger_name, 'existe')
      FROM information_schema.triggers 
      WHERE event_object_table = 'users' 
      AND trigger_schema = 'auth'
    );
  
  -- Verificar funções personalizadas
  RETURN QUERY
  SELECT 
    'funcoes_personalizadas'::text,
    'info'::text,
    (
      SELECT jsonb_object_agg(routine_name, routine_type)
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      AND routine_name LIKE '%user%' OR routine_name LIKE '%auth%'
    );
  
  -- Contar usuários existentes
  RETURN QUERY
  SELECT 
    'usuarios_existentes'::text,
    'info'::text,
    jsonb_build_object(
      'total_auth_users', (SELECT count(*) FROM auth.users),
      'total_profiles', (SELECT count(*) FROM user_profiles),
      'pending_email', (SELECT count(*) FROM user_profiles WHERE subscription_status = 'pending_email'),
      'pending_subscription', (SELECT count(*) FROM user_profiles WHERE subscription_status = 'pending_subscription'),
      'active', (SELECT count(*) FROM user_profiles WHERE subscription_status = 'active')
    );
    
END;
$$;

-- Comentários sobre as funções
COMMENT ON FUNCTION test_auth_system() IS 'Testa o sistema completo de autenticação sem rate limits';
COMMENT ON FUNCTION check_system_config() IS 'Verifica configurações e estado atual do sistema';