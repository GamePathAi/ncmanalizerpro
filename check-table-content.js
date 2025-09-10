import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTableContent() {
  console.log('📋 Verificando conteúdo da tabela user_profiles...');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (error) {
      console.log('❌ Erro ao consultar tabela:', error.message);
      return;
    }
    
    console.log('📊 Total de registros:', data.length);
    
    if (data.length === 0) {
      console.log('📭 Tabela vazia - nenhum usuário cadastrado ainda.');
    } else {
      console.log('\n📋 Dados encontrados:');
      data.forEach((profile, index) => {
        console.log(`\n${index + 1}. Usuário:`);
        console.log(`   🆔 ID: ${profile.id}`);
        console.log(`   📧 Email: ${profile.email}`);
        console.log(`   👤 Nome: ${profile.full_name}`);
        console.log(`   📦 Tipo: ${profile.subscription_type}`);
        console.log(`   📊 Status: ${profile.subscription_status}`);
        console.log(`   🔐 TOTP: ${profile.totp_enabled ? 'Habilitado' : 'Desabilitado'}`);
        console.log(`   📅 Criado: ${new Date(profile.created_at).toLocaleString('pt-BR')}`);
        console.log(`   🔄 Atualizado: ${new Date(profile.updated_at).toLocaleString('pt-BR')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkTableContent();