-- Script para adicionar campos TOTP na tabela user_profiles
-- Execute este script no Supabase SQL Editor

-- Adicionar campos TOTP na tabela user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS totp_backup_codes TEXT[];

-- Comentários para documentação
COMMENT ON COLUMN user_profiles.totp_secret IS 'Secret key para TOTP em base32 (criptografado)';
COMMENT ON COLUMN user_profiles.totp_enabled IS 'Indica se TOTP está ativado para o usuário';
COMMENT ON COLUMN user_profiles.totp_backup_codes IS 'Códigos de backup para recuperação (hasheados)';

-- Índice para consultas por TOTP habilitado
CREATE INDEX IF NOT EXISTS idx_user_profiles_totp_enabled 
ON user_profiles(totp_enabled) 
WHERE totp_enabled = TRUE;

-- Política RLS para campos TOTP (apenas o próprio usuário pode ver/editar)
CREATE POLICY "Users can view their own TOTP settings" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own TOTP settings" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Função para gerar códigos de backup
CREATE OR REPLACE FUNCTION generate_totp_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
    codes TEXT[] := '{}';
    i INTEGER;
    code TEXT;
BEGIN
    -- Gerar 10 códigos de backup de 8 dígitos
    FOR i IN 1..10 LOOP
        code := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
        codes := array_append(codes, code);
    END LOOP;
    
    RETURN codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar código de backup
CREATE OR REPLACE FUNCTION validate_backup_code(user_id UUID, backup_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_codes TEXT[];
    updated_codes TEXT[];
    code_found BOOLEAN := FALSE;
    code_item TEXT;
BEGIN
    -- Buscar códigos do usuário
    SELECT totp_backup_codes INTO user_codes
    FROM user_profiles
    WHERE id = user_id AND totp_enabled = TRUE;
    
    IF user_codes IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se o código existe e removê-lo (uso único)
    FOREACH code_item IN ARRAY user_codes LOOP
        IF code_item = backup_code THEN
            code_found := TRUE;
        ELSE
            updated_codes := array_append(updated_codes, code_item);
        END IF;
    END LOOP;
    
    -- Se código foi encontrado, atualizar lista removendo-o
    IF code_found THEN
        UPDATE user_profiles 
        SET totp_backup_codes = updated_codes
        WHERE id = user_id;
    END IF;
    
    RETURN code_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para limpar dados TOTP quando desabilitado
CREATE OR REPLACE FUNCTION cleanup_totp_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Se TOTP foi desabilitado, limpar dados sensíveis
    IF OLD.totp_enabled = TRUE AND NEW.totp_enabled = FALSE THEN
        NEW.totp_secret := NULL;
        NEW.totp_backup_codes := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_totp_data
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_totp_data();

-- Verificar se as alterações foram aplicadas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('totp_secret', 'totp_enabled', 'totp_backup_codes')
ORDER BY column_name;