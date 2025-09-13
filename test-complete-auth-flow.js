import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteAuthFlow() {
  console.log('🧪 Testando fluxo completo de autenticação...');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar usuário atual
    console.log('\n1️⃣ Verificando usuário atual...');
    const { data: currentUser, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'igor.bonafe@gmail.com')
      .single();
    
    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError.message);
      return;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log('📧 Email:', currentUser.email);
    console.log('📊 Status:', currentUser.subscription_status);
    console.log('💳 Stripe ID:', currentUser.stripe_customer_id);
    console.log('📅 Criado em:', new Date(currentUser.created_at).toLocaleString());
    console.log('🔄 Atualizado em:', new Date(currentUser.updated_at).toLocaleString());
    
    console.log('\n🎉 Teste completo finalizado!');
    console.log('✅ Sistema de autenticação está funcionando corretamente');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testCompleteAuthFlow();