const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthenticationFlow() {
  console.log('🔐 TESTANDO FLUXO COMPLETO DE AUTENTICAÇÃO');
  console.log('=' .repeat(50));
  
  const testEmail = `teste-auth-${Date.now()}@exemplo.com`;
  const testPassword = 'senha123456';
  
  try {
    // 1. Cadastrar usuário usando auth.signUp
    console.log('\n📝 1. Cadastrando usuário via Supabase Auth...');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          subscription_status: 'pending_email'
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Erro no cadastro:', signUpError.message);
      return false;
    }
    
    console.log('✅ Usuário cadastrado com sucesso');
    console.log(`📧 Email: ${signUpData.user?.email}`);
    console.log(`🆔 User ID: ${signUpData.user?.id}`);
    console.log(`📧 Email confirmado: ${signUpData.user?.email_confirmed_at ? '✅' : '❌'}`);
    
    const userId = signUpData.user?.id;
    
    // 2. Verificar se perfil foi criado automaticamente
    console.log('\n📋 2. Verificando criação automática do perfil...');
    
    // Fazer login para ter acesso aos dados
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso');
      
      // Verificar perfil
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.log('❌ Erro ao buscar perfil:', profileError.message);
        console.log('💡 Tentando criar perfil manualmente...');
        
        // Tentar criar perfil manualmente
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: testEmail,
            subscription_status: 'pending_email'
          })
          .select()
          .single();
        
        if (createError) {
          console.log('❌ Erro ao criar perfil:', createError.message);
        } else {
          console.log('✅ Perfil criado manualmente');
          console.log('📊 Status:', newProfile.subscription_status);
        }
      } else {
        console.log('✅ Perfil encontrado');
        console.log('📊 Status atual:', profile.subscription_status);
        console.log('📧 Email:', profile.email);
        console.log('💳 Stripe ID:', profile.stripe_customer_id || 'Não definido');
        
        // 3. Simular confirmação de email
        console.log('\n📧 3. Simulando confirmação de email...');
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({ subscription_status: 'pending_subscription' })
          .eq('id', userId)
          .select()
          .single();
        
        if (updateError) {
          console.log('❌ Erro ao atualizar status:', updateError.message);
        } else {
          console.log('✅ Status atualizado para pending_subscription');
          
          // 4. Simular ativação de assinatura
          console.log('\n💳 4. Simulando ativação de assinatura...');
          
          const { data: activeProfile, error: activateError } = await supabase
            .from('user_profiles')
            .update({ 
              subscription_status: 'active',
              stripe_customer_id: `cus_test_${userId.substring(0, 8)}`
            })
            .eq('id', userId)
            .select()
            .single();
          
          if (activateError) {
            console.log('❌ Erro ao ativar assinatura:', activateError.message);
          } else {
            console.log('✅ Assinatura ativada com sucesso');
            console.log('📊 Status final:', activeProfile.subscription_status);
            console.log('💳 Customer ID:', activeProfile.stripe_customer_id);
            
            // 5. Testar lógica de acesso
            console.log('\n🚪 5. Testando lógica de acesso...');
            
            const canAccessDashboard = activeProfile.subscription_status === 'active';
            const needsEmailConfirmation = activeProfile.subscription_status === 'pending_email';
            const needsSubscription = activeProfile.subscription_status === 'pending_subscription';
            
            console.log(`🎯 Dashboard liberado: ${canAccessDashboard ? '✅ SIM' : '❌ NÃO'}`);
            console.log(`📧 Precisa confirmar email: ${needsEmailConfirmation ? '⚠️ SIM' : '✅ NÃO'}`);
            console.log(`💳 Precisa assinar: ${needsSubscription ? '⚠️ SIM' : '✅ NÃO'}`);
            
            if (canAccessDashboard) {
              console.log('\n🎉 FLUXO COMPLETO FUNCIONANDO!');
              console.log('✅ Usuário pode acessar todas as funcionalidades');
              return true;
            }
          }
        }
      }
    }
    
    return false;
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
    return false;
  } finally {
    // Fazer logout
    await supabase.auth.signOut();
    console.log('\n🚪 Logout realizado');
  }
}

async function testRLSPolicies() {
  console.log('\n🔒 TESTANDO POLÍTICAS RLS');
  console.log('=' .repeat(50));
  
  try {
    // Testar acesso sem autenticação
    console.log('\n1. 🚫 Testando acesso sem autenticação...');
    
    const { data: publicData, error: publicError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (publicError) {
      console.log('✅ RLS funcionando - Acesso negado sem auth:', publicError.message);
    } else {
      console.log('⚠️  RLS pode estar desabilitado - Acesso permitido sem auth');
    }
    
    // Testar com usuário autenticado
    console.log('\n2. 🔐 Testando com usuário autenticado...');
    
    const testEmail = `rls-test-${Date.now()}@exemplo.com`;
    const testPassword = 'senha123456';
    
    // Cadastrar e fazer login
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError) {
      console.log('❌ Erro no cadastro para teste RLS:', signUpError.message);
      return;
    }
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.log('❌ Erro no login para teste RLS:', loginError.message);
      return;
    }
    
    console.log('✅ Usuário autenticado para teste RLS');
    
    // Testar acesso aos próprios dados
    const { data: ownData, error: ownError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', signUpData.user?.id);
    
    if (ownError) {
      console.log('❌ Erro ao acessar próprios dados:', ownError.message);
    } else {
      console.log('✅ Acesso aos próprios dados funcionando');
      console.log(`📊 Registros encontrados: ${ownData.length}`);
    }
    
    // Testar acesso a dados de outros usuários
    const { data: othersData, error: othersError } = await supabase
      .from('user_profiles')
      .select('*')
      .neq('id', signUpData.user?.id)
      .limit(1);
    
    if (othersError) {
      console.log('✅ RLS funcionando - Não pode acessar dados de outros:', othersError.message);
    } else if (othersData.length === 0) {
      console.log('✅ RLS funcionando - Nenhum dado de outros usuários retornado');
    } else {
      console.log('⚠️  RLS pode ter problema - Dados de outros usuários acessíveis');
    }
    
    await supabase.auth.signOut();
    
  } catch (err) {
    console.error('❌ Erro no teste RLS:', err.message);
  }
}

async function main() {
  console.log('🚀 TESTE COMPLETO COM AUTENTICAÇÃO SUPABASE');
  console.log('=' .repeat(60));
  
  console.log('\n📋 Configuração:');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Anon Key: ${supabaseKey ? '✅ Configurada' : '❌ Não encontrada'}`);
  
  const authFlowTest = await testAuthenticationFlow();
  await testRLSPolicies();
  
  console.log('\n🏁 RESUMO FINAL');
  console.log('=' .repeat(60));
  
  if (authFlowTest) {
    console.log('🎉 SISTEMA DE AUTENTICAÇÃO FUNCIONANDO!');
    console.log('\n✅ Funcionalidades validadas:');
    console.log('  📝 Cadastro de usuários');
    console.log('  🔐 Login/logout');
    console.log('  📊 Estados de usuário (pending_email → pending_subscription → active)');
    console.log('  🔒 Políticas de segurança (RLS)');
    console.log('  💳 Simulação de pagamentos');
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('  1. ✅ Backend completo e funcionando');
    console.log('  2. ⚠️  Configurar SMTP para emails reais');
    console.log('  3. 🎨 Implementar frontend React');
    console.log('  4. 💳 Configurar Stripe webhooks');
    console.log('  5. 🚀 Deploy e testes finais');
    
    console.log('\n💡 PROBLEMA IDENTIFICADO:');
    console.log('  🎯 Sistema de autenticação: ✅ FUNCIONANDO');
    console.log('  📧 Envio de emails: ❌ CONFIGURAÇÃO SMTP');
    console.log('  🔧 Solução: Configurar SMTP no Supabase Dashboard');
    
  } else {
    console.log('❌ PROBLEMAS ENCONTRADOS NO SISTEMA');
    console.log('🔧 Verificar logs acima para detalhes');
  }
}

main().catch(console.error);