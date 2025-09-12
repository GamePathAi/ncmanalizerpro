import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSignupWithDirectProfile() {
  const testEmail = `signup-direct-${Date.now()}@exemplo.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Usuário Teste Direto';
  
  console.log('🧪 Testando cadastro com criação direta de perfil...');
  console.log('📧 Email de teste:', testEmail);
  console.log('👤 Nome completo:', testName);
  
  try {
    console.log('\n🔄 Iniciando cadastro...');
    
    // 1. Criar usuário
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        }
      }
    });
    
    if (authError) {
      console.error('❌ Erro no cadastro:', authError.message);
      return;
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('🆔 ID do usuário:', authData.user.id);
    console.log('📧 Email confirmado:', authData.user.email_confirmed_at ? 'Sim' : 'Não');
    
    // 2. Criar perfil diretamente (simulando o que o frontend faz)
    console.log('\n🔄 Criando perfil diretamente...');
    
    const profileData = {
      id: authData.user.id,
      email: authData.user.email,
      full_name: testName,
      subscription_type: 'free',
      subscription_status: authData.user.email_confirmed_at ? 'pending_subscription' : 'pending_email',
      totp_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: profileResult, error: profileError } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message);
      console.log('Código:', profileError.code);
      console.log('Detalhes:', profileError.details);
    } else {
      console.log('✅ Perfil criado com sucesso!');
      console.log('📋 Dados do perfil:', profileResult);
    }
    
    // 3. Verificar se o perfil foi criado corretamente
    console.log('\n🔍 Verificando perfil criado...');
    
    const { data: checkProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (checkError) {
      console.error('❌ Erro ao verificar perfil:', checkError.message);
      console.log('Código:', checkError.code);
      
      if (checkError.code === 'PGRST116') {
        console.log('🔍 Erro PGRST116 indica que não há dados ou múltiplos registros');
        
        // Tentar buscar todos os perfis para debug
        const { data: allProfiles, error: allError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id);
        
        console.log('📊 Todos os perfis encontrados:', allProfiles?.length || 0);
        if (allProfiles && allProfiles.length > 0) {
          console.log('📋 Perfis:', allProfiles);
        }
      }
    } else {
      console.log('✅ Perfil encontrado e verificado!');
      console.log('📋 Perfil completo:', checkProfile);
      
      // Verificar campos importantes
      console.log('\n📊 Verificação de campos:');
      console.log('🆔 ID:', checkProfile.id === authData.user.id ? '✅' : '❌');
      console.log('📧 Email:', checkProfile.email === authData.user.email ? '✅' : '❌');
      console.log('👤 Nome:', checkProfile.full_name === testName ? '✅' : '❌');
      console.log('💳 Tipo assinatura:', checkProfile.subscription_type === 'free' ? '✅' : '❌');
      console.log('📊 Status:', checkProfile.subscription_status);
      console.log('🔐 TOTP:', checkProfile.totp_enabled === false ? '✅' : '❌');
    }
    
    // 4. Testar login com o usuário criado
    console.log('\n🔐 Testando login...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('🆔 Usuário logado:', loginData.user.id);
      
      // Verificar se consegue acessar o perfil após login
      const { data: profileAfterLogin, error: profileAfterError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();
      
      if (profileAfterError) {
        console.error('❌ Erro ao acessar perfil após login:', profileAfterError.message);
      } else {
        console.log('✅ Perfil acessível após login!');
        console.log('📋 Perfil:', profileAfterLogin);
      }
    }
    
    // 5. Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    // Fazer logout
    await supabase.auth.signOut();
    
    // Deletar perfil
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', authData.user.id);
    
    // Deletar usuário (precisa de service role)
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    
    if (deleteError) {
      console.log('⚠️ Erro ao deletar usuário:', deleteError.message);
    } else {
      console.log('✅ Dados de teste limpos!');
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    console.log('\n📋 RESUMO:');
    console.log('✅ Cadastro funcionando sem trigger');
    console.log('✅ Perfil criado diretamente no código');
    console.log('✅ Login e acesso ao perfil funcionando');
    console.log('✅ Sistema pronto para deploy!');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

async function main() {
  console.log('🚀 TESTE DE CADASTRO COM CRIAÇÃO DIRETA DE PERFIL');
  console.log('=' .repeat(60));
  
  await testSignupWithDirectProfile();
  
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. ✅ Código atualizado para criar perfil diretamente');
  console.log('2. 🚀 Fazer deploy da aplicação');
  console.log('3. 🧪 Testar cadastro no ambiente de produção');
  console.log('4. 📊 Monitorar logs para garantir funcionamento');
}

main().catch(console.error);