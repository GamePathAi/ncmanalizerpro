import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTOTPFields() {
  console.log('🔍 Verificando campos TOTP na tabela user_profiles...');
  
  try {
    // Tentar fazer uma consulta simples para ver a estrutura da tabela
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao acessar user_profiles:', error.message);
      return;
    }
    
    console.log('✅ Tabela user_profiles acessível');
    
    if (data && data.length > 0) {
      const fields = Object.keys(data[0]);
      console.log('📋 Campos existentes na tabela:');
      fields.forEach(field => {
        console.log(`  - ${field}`);
      });
      
      // Verificar campos TOTP específicos
      const totpFields = ['totp_secret', 'totp_enabled', 'totp_backup_codes'];
      const missingFields = totpFields.filter(field => !fields.includes(field));
      
      if (missingFields.length === 0) {
        console.log('\n✅ Todos os campos TOTP estão presentes!');
      } else {
        console.log('\n❌ Campos TOTP faltando:');
        missingFields.forEach(field => {
          console.log(`  - ${field}`);
        });
        console.log('\n📝 Execute o arquivo add-totp-fields.sql no Supabase Dashboard para adicionar os campos.');
      }
    } else {
      console.log('⚠️ Tabela user_profiles está vazia, não é possível verificar estrutura.');
      console.log('💡 Tente criar um usuário primeiro ou verificar se a tabela existe.');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkTOTPFields();