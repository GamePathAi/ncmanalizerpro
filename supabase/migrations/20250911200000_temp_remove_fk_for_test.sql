-- Migração temporária para remover foreign key constraint para testes
-- Esta migração será revertida após os testes

ALTER TABLE password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;

-- Comentário: Esta constraint será recriada após os testes