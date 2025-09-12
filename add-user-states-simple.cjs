const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function addUserStatesFields() {
  console.log('🔧 Adicionando campos de estados de usuário...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Primeiro, vamos verificar se conseguimos acessar a tabela
    console.log('🔍 Verificando acesso à tabela user_profiles...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('id, email, subscription_status')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro ao acessar tabela:', testError.message);
      return;
    }
    
    console.log('✅ Acesso à tabela confirmado');
    
    // Verificar se os campos já existem
    if (testData && testData.length > 0) {
      const existingFields = Object.keys(testData[0]);
      console.log('📋 Campos existentes:', existingFields.join(', '));
      
      const requiredFields = ['email_verified_at', 'user_state', 'stripe_customer_id'];
      const missingFields = requiredFields.filter(field => !existingFields.includes(field));
      
      if (missingFields.length === 0) {
        console.log('✅ Todos os campos necessários já existem!');
        return;
      }
      
      console.log('⚠️ Campos faltando:', missingFields.join(', '));
    }
    
    // Como não podemos executar ALTER TABLE diretamente com a chave anon,
    // vamos criar um guia para execução manual
    console.log('\n📝 INSTRUÇÕES PARA EXECUÇÃO MANUAL:');
    console.log('\n1. Acesse o dashboard do Supabase:');
    console.log('   https://supabase.com/dashboard/project/fsntzljufghutoyqxokm');
    console.log('\n2. Vá para SQL Editor');
    console.log('\n3. Execute os seguintes comandos SQL:');
    console.log('\n-- Adicionar campos necessários');
    console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;');
    console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_state TEXT CHECK (user_state IN (\'pending_email\', \'pending_subscription\', \'active\')) DEFAULT \'pending_email\';');
    console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;');
    console.log('\n-- Criar índices');
    console.log('CREATE INDEX IF NOT EXISTS idx_user_profiles_user_state ON user_profiles(user_state);');
    console.log('CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON user_profiles(email_verified_at);');
    
    console.log('\n-- Atualizar usuários existentes');
    console.log(`UPDATE user_profiles 
SET 
    email_verified_at = (
        SELECT email_confirmed_at 
        FROM auth.users 
        WHERE auth.users.id = user_profiles.id
    ),
    user_state = CASE 
        WHEN (
            SELECT email_confirmed_at 
            FROM auth.users 
            WHERE auth.users.id = user_profiles.id
        ) IS NULL THEN 'pending_email'
        WHEN subscription_status = 'active' THEN 'active'
        ELSE 'pending_subscription'
    END;`);
    
    console.log('\n4. Após executar, execute este script novamente para verificar');
    
    // Tentar uma abordagem alternativa usando upsert
    console.log('\n🔄 Tentando abordagem alternativa...');
    
    // Verificar se podemos pelo menos ler dados de usuários
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('⚠️ Não há usuário logado para teste');
    } else {
      console.log('✅ Contexto de usuário disponível');
    }
    
    // Criar um arquivo SQL para execução manual
    const fs = require('fs');
    const sqlContent = `-- Estados de usuário - Execução manual
-- Execute este SQL no dashboard do Supabase

-- Adicionar campos necessários
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_state TEXT CHECK (user_state IN ('pending_email', 'pending_subscription', 'active')) DEFAULT 'pending_email';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_state ON user_profiles(user_state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON user_profiles(email_verified_at);

-- Função para atualizar estado do usuário
CREATE OR REPLACE FUNCTION update_user_state()
RETURNS TRIGGER AS $$
BEGIN
    -- Se email não foi verificado, estado é pending_email
    IF NEW.email_verified_at IS NULL THEN
        NEW.user_state = 'pending_email';
    -- Se email foi verificado mas não tem assinatura ativa, estado é pending_subscription
    ELSIF NEW.subscription_status != 'active' OR NEW.subscription_status IS NULL THEN
        NEW.user_state = 'pending_subscription';
    -- Se email foi verificado e tem assinatura ativa, estado é active
    ELSE
        NEW.user_state = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estado automaticamente
DROP TRIGGER IF EXISTS update_user_state_trigger ON user_profiles;
CREATE TRIGGER update_user_state_trigger
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_state();

-- Atualizar usuários existentes
UPDATE user_profiles 
SET 
    email_verified_at = (
        SELECT email_confirmed_at 
        FROM auth.users 
        WHERE auth.users.id = user_profiles.id
    ),
    user_state = CASE 
        WHEN (
            SELECT email_confirmed_at 
            FROM auth.users 
            WHERE auth.users.id = user_profiles.id
        ) IS NULL THEN 'pending_email'
        WHEN subscription_status = 'active' THEN 'active'
        ELSE 'pending_subscription'
    END;

SELECT 'Estados de usuário implementados!' as result;`;
    
    fs.writeFileSync('manual-user-states.sql', sqlContent);
    console.log('\n📄 Arquivo manual-user-states.sql criado para execução manual');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

addUserStatesFields().catch(console.error);