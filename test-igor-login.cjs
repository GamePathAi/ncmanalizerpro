const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testIgorLogin() {
  try {
    console.log('🔍 Testando login do usuário igor.bonafe@gmail.com...');
    
    // Buscar o usuário
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    const igor = users.find(u => u.email === 'igor.bonafe@gmail.com');
    
    if (!igor) {
      console.log('❌ Usuário igor.bonafe@gmail.com não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log(`   - ID: ${igor.id}`);
    console.log(`   - Email: ${igor.email}`);
    console.log(`   - Email confirmado: ${igor.email_confirmed_at ? 'Sim' : 'Não'}`);
    console.log(`   - Criado em: ${igor.created_at}`);
    
    // Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', igor.id)
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }
    
    console.log('\n📊 Status do perfil:');
    console.log(`   - Status da assinatura: ${profile.subscription_status}`);
    console.log(`   - Stripe Customer ID: ${profile.customer_id || 'Não definido'}`);
    console.log(`   - Tipo de assinatura: ${profile.subscription_type || 'Não definido'}`);
    
    // Verificar se pode fazer login
    console.log('\n🔐 Verificações de acesso:');
    
    const canLogin = igor.email_confirmed_at !== null;
    console.log(`   - Pode fazer login: ${canLogin ? '✅ Sim' : '❌ Não'} (email ${igor.email_confirmed_at ? 'confirmado' : 'não confirmado'})`);
    
    const hasActiveSubscription = profile.subscription_status === 'active';
    console.log(`   - Tem assinatura ativa: ${hasActiveSubscription ? '✅ Sim' : '❌ Não'} (status: ${profile.subscription_status})`);
    
    const canAccessDashboard = canLogin && hasActiveSubscription;
    console.log(`   - Pode acessar dashboard: ${canAccessDashboard ? '✅ Sim' : '❌ Não'}`);
    
    if (canLogin && !hasActiveSubscription) {
      console.log('   - 🎯 Deve ser redirecionado para: Página de Pricing');
    }
    
    console.log('\n📋 Resumo do status:');
    if (profile.subscription_status === 'pending_email') {
      console.log('   - ⏳ Aguardando confirmação de email');
    } else if (profile.subscription_status === 'pending_subscription') {
      console.log('   - 💳 Email confirmado, aguardando assinatura');
    } else if (profile.subscription_status === 'active') {
      console.log('   - ✅ Totalmente ativo - acesso completo');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testIgorLogin();