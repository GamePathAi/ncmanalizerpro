const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugUserStatus() {
  try {
    console.log('🔍 Verificando usuários e seus status...');
    
    // Buscar todos os usuários
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    console.log(`📊 Total de usuários: ${users.users.length}`);
    
    for (const user of users.users) {
      console.log('\n' + '='.repeat(50));
      console.log(`👤 Usuário: ${user.email}`);
      console.log(`🆔 ID: ${user.id}`);
      console.log(`✅ Email confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
      console.log(`📅 Criado em: ${user.created_at}`);
      
      // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
    }

    if (!profile) {
      console.log('🔧 Criando perfil...');
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          subscription_status: user.email_confirmed_at ? 'pending_subscription' : 'pending_email'
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Erro ao criar perfil:', createError.message);
      } else {
        console.log('✅ Perfil criado com status:', newProfile.subscription_status);
      }
    } else {
       console.log('📊 Status da assinatura:', profile.subscription_status);
       console.log('📧 Email no perfil:', profile.email);
       console.log('🎯 Stripe Customer ID:', profile.customer_id || 'Não definido');
     }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugUserStatus();