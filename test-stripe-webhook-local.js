import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuração do Supabase
const supabaseUrl = 'https://abxubuocnmuiojinevgy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVidW9jbm11aW9qaW5ldmd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5MDc5MCwiZXhwIjoyMDczMTY2NzkwfQ.Bz3rvJLhe-DMbgAohoHN2SlnPNQpnjwelhSNrqHISis';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simular evento de checkout completado do Stripe
const simulateStripeWebhook = async () => {
  console.log('🧪 Testando webhook do Stripe localmente...');
  
  // Dados simulados de um checkout bem-sucedido
  const mockCheckoutSession = {
    id: 'cs_test_' + crypto.randomBytes(16).toString('hex'),
    object: 'checkout.session',
    customer: 'cus_test_' + crypto.randomBytes(8).toString('hex'),
    customer_email: 'teste@exemplo.com',
    payment_status: 'paid',
    status: 'complete',
    subscription: 'sub_test_' + crypto.randomBytes(8).toString('hex'),
    line_items: {
      data: [{
        price: {
          id: process.env.VITE_STRIPE_PRICE_MONTHLY || 'price_test_monthly',
          nickname: 'Plano Mensal'
        },
        quantity: 1
      }]
    },
    metadata: {
      user_id: null // Será preenchido com um usuário real
    }
  };
  
  try {
    // 1. Buscar um usuário de teste existente
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('subscription_status', 'pending_subscription')
      .limit(1);
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️  Nenhum usuário com status pending_subscription encontrado.');
      console.log('💡 Criando usuário de teste...');
      
      // Criar usuário de teste
      const { data: newUser, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          email: 'teste-webhook@exemplo.com',
          subscription_status: 'pending_subscription',
          email_verified: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar usuário de teste:', createError);
        return;
      }
      
      mockCheckoutSession.metadata.user_id = newUser.id;
      console.log('✅ Usuário de teste criado:', newUser.email);
    } else {
      mockCheckoutSession.metadata.user_id = users[0].id;
      console.log('✅ Usando usuário existente:', users[0].email);
    }
    
    // 2. Simular processamento do webhook
    console.log('🔄 Processando checkout completado...');
    
    // Determinar tipo de plano
    let planType = 'monthly';
    const priceId = mockCheckoutSession.line_items.data[0].price.id;
    
    if (priceId.includes('yearly') || priceId.includes('annual')) {
      planType = 'yearly';
    } else if (priceId.includes('lifetime')) {
      planType = 'lifetime';
    }
    
    // 3. Atualizar perfil do usuário
    const updateData = {
      subscription_status: 'active',
      stripe_customer_id: mockCheckoutSession.customer,
      subscription_type: planType,
      updated_at: new Date().toISOString()
    };
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', mockCheckoutSession.metadata.user_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError);
      return;
    }
    
    console.log('✅ Usuário atualizado com sucesso!');
    console.log('📊 Dados da assinatura:', {
      email: updatedUser.email,
      status: updatedUser.subscription_status,
      plan: updatedUser.plan_type,
      customer_id: updatedUser.stripe_customer_id,
      subscription_id: updatedUser.stripe_subscription_id
    });
    
    // 4. Simular envio de email de confirmação
    console.log('📧 Email de confirmação seria enviado para:', updatedUser.email);
    
    console.log('\n🎉 Teste do webhook concluído com sucesso!');
    console.log('💡 O usuário agora pode acessar o dashboard completo.');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
};

// Executar o teste
simulateStripeWebhook().then(() => {
  console.log('\n✨ Teste finalizado. Verifique o dashboard da aplicação.');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha no teste:', error);
  process.exit(1);
});