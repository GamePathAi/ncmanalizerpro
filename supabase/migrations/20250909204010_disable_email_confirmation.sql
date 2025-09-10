-- Desabilitar confirmação de email temporariamente
-- Isso permite que usuários se cadastrem sem precisar confirmar o email

-- Atualizar configurações de autenticação
UPDATE auth.config 
SET 
  enable_email_confirmations = false,
  enable_signup = true
WHERE true;

-- Verificar se a configuração foi aplicada
SELECT 
  'email_confirmations' as setting,
  CASE WHEN enable_email_confirmations THEN 'Habilitado' ELSE 'Desabilitado' END as status
FROM auth.config
LIMIT 1;