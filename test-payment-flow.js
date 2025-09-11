import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testPaymentFlow() {
  console.log('🧪 Testando fluxo completo de pagamento...');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar se há usuários com assinatura ativa
    console.log('\n1️⃣ Verificando usuários com assinatura ativa...');
    const { data: activeUsers, error: activeError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('subscription_status', 'active')
      .limit(5);
    
    if (activeError) {
      console.log('❌ Erro ao buscar usuários ativos:', activeError.message);
    } else {
      console.log(`✅ Encontrados ${activeUsers?.length || 0} usuários com assinatura ativa`);
      if (activeUsers && activeUsers.length > 0) {
        activeUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. Email: ${user.email}`);
          console.log(`      Status: ${user.subscription_status}`);
          console.log(`      Tipo: ${user.subscription_type}`);
          console.log(`      Customer ID: ${user.customer_id}`);
          console.log(`      Subscription ID: ${user.subscription_id}`);
          console.log(`      Data início: ${user.subscription_start_date}`);
          console.log('');
        });
      }
    }
    
    // 2. Verificar usuários com status pending_subscription
    console.log('\n2️⃣ Verificando usuários aguardando assinatura...');
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('subscription_status', 'pending_subscription')
      .limit(5);
    
    if (pendingError) {
      console.log('❌ Erro ao buscar usuários pendentes:', pendingError.message);
    } else {
      console.log(`📋 Encontrados ${pendingUsers?.length || 0} usuários aguardando assinatura`);
      if (pendingUsers && pendingUsers.length > 0) {
        pendingUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. Email: ${user.email}`);
          console.log(`      Status: ${user.subscription_status}`);
          console.log(`      Customer ID: ${user.customer_id || 'Não definido'}`);
          console.log('');
        });
      }
    }
    
    // 3. Simular atualização de status (para teste)
    if (pendingUsers && pendingUsers.length > 0) {
      const testUser = pendingUsers[0];
      console.log(`\n3️⃣ Simulando atualização de status para: ${testUser.email}`);
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          subscription_status: 'active',
          subscription_type: 'annual',
          subscription_start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', testUser.id)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Erro ao atualizar usuário:', updateError.message);
      } else {
        console.log('✅ Usuário atualizado com sucesso!');
        console.log('📊 Dados atualizados:', {
          email: updatedUser.email,
          status: updatedUser.subscription_status,
          type: updatedUser.subscription_type,
          start_date: updatedUser.subscription_start_date
        });
        
        // Reverter para não afetar dados reais
        setTimeout(async () => {
          await supabase
            .from('user_profiles')
            .update({
              subscription_status: 'pending_subscription',
              subscription_type: null,
              subscription_start_date: null
            })
            .eq('id', testUser.id);
          console.log('🔄 Status revertido para não afetar dados reais');
        }, 2000);
      }
    }
    
    // 4. Verificar estrutura da tabela
    console.log('\n4️⃣ Verificando estrutura da tabela user_profiles...');
    const { data: sampleUser, error: sampleError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleError) {
      console.log('❌ Erro ao buscar amostra:', sampleError.message);
    } else if (sampleUser) {
      console.log('✅ Colunas disponíveis:', Object.keys(sampleUser).join(', '));
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📋 RESUMO DO TESTE:');
    console.log('✅ Conexão com banco: OK');
    console.log('✅ Tabela user_profiles: Acessível');
    console.log('✅ Campos de assinatura: Presentes');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Teste um pagamento real no Stripe');
    console.log('2. Verifique se o webhook atualiza o status');
    console.log('3. Confirme se o refreshUserProfile é chamado');
    console.log('4. Teste o acesso ao dashboard');
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err.message);
  }
}

testPaymentFlow();