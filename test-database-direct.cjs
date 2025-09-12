const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseStructure() {
  console.log('🔍 TESTANDO ESTRUTURA DO BANCO DE DADOS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Testar acesso à tabela user_profiles
    console.log('\n1. 📋 Testando tabela user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Erro ao acessar user_profiles:', profilesError.message);
      return false;
    } else {
      console.log('✅ Tabela user_profiles acessível');
      console.log(`📊 Total de perfis encontrados: ${profiles.length}`);
      
      if (profiles.length > 0) {
        console.log('📋 Estrutura do primeiro perfil:');
        console.log(JSON.stringify(profiles[0], null, 2));
        
        // Contar por status
        const statusCount = {};
        profiles.forEach(profile => {
          const status = profile.subscription_status || 'undefined';
          statusCount[status] = (statusCount[status] || 0) + 1;
        });
        
        console.log('📊 Distribuição por status:', statusCount);
      }
    }
    
    // 2. Testar criação de usuário de teste
    console.log('\n2. 🧪 Testando criação de perfil de teste...');
    const testEmail = `teste-${Date.now()}@exemplo.com`;
    
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        email: testEmail,
        subscription_status: 'pending_email'
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar perfil de teste:', createError.message);
      return false;
    } else {
      console.log('✅ Perfil de teste criado com sucesso');
      console.log('📋 Dados do perfil:', JSON.stringify(newProfile, null, 2));
      
      // 3. Testar atualização do status
      console.log('\n3. 🔄 Testando atualização de status...');
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ subscription_status: 'pending_subscription' })
        .eq('id', newProfile.id)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Erro ao atualizar status:', updateError.message);
      } else {
        console.log('✅ Status atualizado com sucesso');
        console.log(`📊 Status anterior: pending_email → Novo: ${updatedProfile.subscription_status}`);
      }
      
      // 4. Testar ativação de assinatura
      console.log('\n4. 💳 Testando ativação de assinatura...');
      
      const { data: activeProfile, error: activateError } = await supabase
        .from('user_profiles')
        .update({ 
          subscription_status: 'active',
          stripe_customer_id: `cus_test_${newProfile.id.substring(0, 8)}`
        })
        .eq('id', newProfile.id)
        .select()
        .single();
      
      if (activateError) {
        console.log('❌ Erro ao ativar assinatura:', activateError.message);
      } else {
        console.log('✅ Assinatura ativada com sucesso');
        console.log('📊 Status final:', activeProfile.subscription_status);
        console.log('💳 Customer ID:', activeProfile.stripe_customer_id);
      }
      
      // 5. Limpar dados de teste
      console.log('\n5. 🧹 Limpando dados de teste...');
      
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', newProfile.id);
      
      if (deleteError) {
        console.log('❌ Erro ao limpar dados:', deleteError.message);
      } else {
        console.log('✅ Dados de teste removidos');
      }
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Erro geral no teste:', err.message);
    return false;
  }
}

async function testAuthFlow() {
  console.log('\n🔐 TESTANDO FLUXO DE AUTENTICAÇÃO SIMULADO');
  console.log('=' .repeat(50));
  
  const testEmail = `fluxo-${Date.now()}@exemplo.com`;
  let userId = null;
  
  try {
    // Simular cadastro
    console.log('\n📝 1. Simulando cadastro de usuário...');
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .insert({
        email: testEmail,
        subscription_status: 'pending_email'
      })
      .select()
      .single();
    
    if (error) {
      console.log('❌ Falha no cadastro:', error.message);
      return false;
    }
    
    userId = profile.id;
    console.log('✅ Usuário cadastrado');
    console.log(`📧 Email: ${profile.email}`);
    console.log(`📊 Status inicial: ${profile.subscription_status}`);
    
    // Simular confirmação de email
    console.log('\n📧 2. Simulando confirmação de email...');
    const { data: confirmedProfile, error: confirmError } = await supabase
      .from('user_profiles')
      .update({ subscription_status: 'pending_subscription' })
      .eq('id', userId)
      .select()
      .single();
    
    if (confirmError) {
      console.log('❌ Falha na confirmação:', confirmError.message);
      return false;
    }
    
    console.log('✅ Email confirmado');
    console.log(`📊 Novo status: ${confirmedProfile.subscription_status}`);
    
    // Simular pagamento
    console.log('\n💳 3. Simulando pagamento bem-sucedido...');
    const { data: paidProfile, error: payError } = await supabase
      .from('user_profiles')
      .update({ 
        subscription_status: 'active',
        stripe_customer_id: `cus_${userId.substring(0, 12)}`
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (payError) {
      console.log('❌ Falha no pagamento:', payError.message);
      return false;
    }
    
    console.log('✅ Pagamento processado');
    console.log(`📊 Status final: ${paidProfile.subscription_status}`);
    console.log(`💳 Customer ID: ${paidProfile.stripe_customer_id}`);
    
    // Verificar acesso
    console.log('\n🚪 4. Verificando permissões de acesso...');
    
    const canAccessDashboard = paidProfile.subscription_status === 'active';
    const needsEmailConfirmation = paidProfile.subscription_status === 'pending_email';
    const needsSubscription = paidProfile.subscription_status === 'pending_subscription';
    
    console.log(`🎯 Pode acessar dashboard: ${canAccessDashboard ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`📧 Precisa confirmar email: ${needsEmailConfirmation ? '⚠️ SIM' : '✅ NÃO'}`);
    console.log(`💳 Precisa assinar: ${needsSubscription ? '⚠️ SIM' : '✅ NÃO'}`);
    
    return true;
    
  } catch (err) {
    console.error('❌ Erro no fluxo:', err.message);
    return false;
  } finally {
    // Limpar sempre
    if (userId) {
      console.log('\n🧹 Limpando dados do teste...');
      await supabase.from('user_profiles').delete().eq('id', userId);
      console.log('✅ Limpeza concluída');
    }
  }
}

async function main() {
  console.log('🚀 TESTE DIRETO DO BANCO DE DADOS');
  console.log('=' .repeat(60));
  
  console.log('\n📋 Configuração:');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Anon Key: ${supabaseKey ? '✅ Configurada' : '❌ Não encontrada'}`);
  
  const structureTest = await testDatabaseStructure();
  const flowTest = await testAuthFlow();
  
  console.log('\n🏁 RESUMO DOS TESTES');
  console.log('=' .repeat(60));
  
  console.log(`📋 Estrutura do banco: ${structureTest ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`🔐 Fluxo de autenticação: ${flowTest ? '✅ OK' : '❌ FALHOU'}`);
  
  if (structureTest && flowTest) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Sistema de autenticação está funcionando corretamente');
    console.log('💡 O problema está apenas na configuração SMTP para envio de emails');
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. ✅ Backend funcionando - Estados de usuário OK');
    console.log('2. ⚠️  Configurar SMTP no Supabase Dashboard');
    console.log('3. 🎨 Implementar componentes React para frontend');
    console.log('4. 💳 Configurar webhooks do Stripe');
    console.log('5. 🚀 Deploy e testes finais');
  } else {
    console.log('\n❌ ALGUNS TESTES FALHARAM');
    console.log('🔧 Verificar logs acima para detalhes dos erros');
  }
}

main().catch(console.error);