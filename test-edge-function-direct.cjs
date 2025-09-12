require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testEdgeFunctionDirect() {
  console.log('🔍 Testando Edge Function diretamente...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    return;
  }
  
  console.log('📋 Configurações:');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Monthly Price ID:', process.env.VITE_STRIPE_MONTHLY_PRICE_ID);
  
  // Criar cliente com service role key para bypass de auth
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    console.log('\n🔄 Testando Edge Function...');
    
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId: process.env.VITE_STRIPE_MONTHLY_PRICE_ID,
        userId: 'test-user-id',
        userEmail: 'test@example.com'
      }
    });
    
    if (error) {
      console.error('❌ Erro da Edge Function:', error);
      return;
    }
    
    if (data && data.url) {
      console.log('✅ Edge Function funcionou!');
      console.log('🔗 URL de checkout:', data.url);
      console.log('✅ Teste bem-sucedido!');
    } else {
      console.error('❌ Resposta inválida da Edge Function:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar Edge Function:', error.message);
  }
}

testEdgeFunctionDirect().catch(console.error);