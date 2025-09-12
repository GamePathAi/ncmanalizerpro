import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSignupAuthFlow() {
  console.log('🧪 Testando fluxo completo de cadastro e autenticação...');
  console.log('=' .repeat(60));
  
  const testEmail = `test${Date.now()}@gmail.com`;
  const testPassword = 'TestPassword123!';
  const testFullName = 'Usuário Teste Auth';
  
  console.log(`📧 Email de teste: ${testEmail}`);
  console.log(`👤 Nome: ${testFullName}`);
  
  try {
    // 1. Verificar configuração inicial
    console.log('\n1️⃣ Verificando configuração do Supabase...');
    console.log('🔗 URL:', process.env.VITE_SUPABASE_URL);
    console.log('🔑 Anon Key:', process.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'Ausente');
    
    // 2. Testar cadastro
    console.log('\n2️⃣ Executando cadastro...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName
        }
      }
    });
    
    if (signupError) {
      console.log('❌ Erro no cadastro:', signupError.message);
      return;
    }
    
    console.log('✅ Cadastro realizado com sucesso!');
    console.log('👤 Usuário criado:', signupData.user?.id);
    console.log('📧 Email confirmado:', signupData.user?.email_confirmed_at ? 'Sim' : 'Não');
    console.log('🔐 Sessão criada:', signupData.session ? 'Sim' : 'Não');
    
    // 3. Verificar se o usuário está logado
    console.log('\n3️⃣ Verificando estado da autenticação...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao obter sessão:', sessionError.message);
    } else {
      console.log('📊 Sessão ativa:', session ? 'Sim' : 'Não');
      if (session) {
        console.log('👤 Usuário na sessão:', session.user.email);
        console.log('🔑 Access Token:', session.access_token ? 'Presente' : 'Ausente');
      }
    }
    
    // 4. Verificar se o perfil foi criado
    console.log('\n4️⃣ Verificando criação do perfil...');
    if (signupData.user?.id) {
      // Aguardar um pouco para o trigger executar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', signupData.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Erro ao buscar perfil:', profileError.message);
        if (profileError.code === 'PGRST116') {
          console.log('💡 Perfil não foi criado - verificar trigger');
        }
      } else {
        console.log('✅ Perfil criado com sucesso!');
        console.log('📊 Status da assinatura:', profile.subscription_status);
        console.log('👤 Nome completo:', profile.full_name);
      }
    }
    
    // 5. Testar navegação para pricing
    console.log('\n5️⃣ Simulando navegação para pricing...');
    if (session && session.user) {
      console.log('✅ Usuário deveria estar logado na página de pricing');
      console.log('🎯 Estado esperado: pending_subscription');
      console.log('🛒 Botões de assinatura: Deveriam funcionar');
    } else {
      console.log('❌ Usuário NÃO está logado');
      console.log('🚨 PROBLEMA: Usuário será redirecionado mas não conseguirá assinar');
    }
    
    // 6. Diagnóstico do problema
    console.log('\n6️⃣ Diagnóstico do problema...');
    
    if (!session) {
      console.log('🔍 CAUSA RAIZ: Usuário não fica logado após cadastro');
      console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
      console.log('1. Verificar se confirmação de email está desabilitada');
      console.log('2. Verificar se o AuthContext está detectando a sessão');
      console.log('3. Verificar se há erro no listener de auth state change');
      console.log('4. Verificar configurações de RLS no Supabase');
      
      // Verificar configurações de auth
      console.log('\n🔧 Verificando configurações...');
      try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
          }
        });
        
        if (response.ok) {
          const settings = await response.json();
          console.log('📧 Confirmação de email:', settings.email_confirm ? 'Habilitada' : 'Desabilitada');
          console.log('🔐 Auto confirmação:', settings.email_confirm_auto ? 'Habilitada' : 'Desabilitada');
        }
      } catch (error) {
        console.log('⚠️ Não foi possível verificar configurações de auth');
      }
    } else {
      console.log('✅ Usuário está logado corretamente');
      console.log('🎯 O problema pode estar no componente PricingPlans');
    }
    
    // 7. Limpeza
    console.log('\n7️⃣ Fazendo logout para limpeza...');
    await supabase.auth.signOut();
    console.log('✅ Logout realizado');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 RESUMO DO TESTE CONCLUÍDO');
  console.log('\n🔍 PRÓXIMOS PASSOS:');
  console.log('1. Se usuário não fica logado: Verificar configurações de email no Supabase');
  console.log('2. Se usuário fica logado: Verificar componente PricingPlans');
  console.log('3. Testar no browser: http://localhost:5173');
}

testSignupAuthFlow();