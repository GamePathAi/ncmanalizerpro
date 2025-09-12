require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testCheckoutWithAuth() {
  console.log('🔍 Testando checkout com autenticação completa...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !anonKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    return;
  }
  
  console.log('📋 Configurações:');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Monthly Price ID:', process.env.VITE_STRIPE_MONTHLY_PRICE_ID);
  
  // Criar cliente com anon key
  const supabase = createClient(supabaseUrl, anonKey);
  
  try {
    // Primeiro, criar um usuário de teste
    const testEmail = `user${Date.now()}@gmail.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('\n🔄 Criando usuário de teste...');
    console.log('📧 Email de teste:', testEmail);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: undefined // Desabilitar redirect de email
      }
    });
    
    if (signUpError) {
      console.error('❌ Erro no signup:', signUpError.message);
      return;
    }
    
    console.log('✅ Usuário criado com sucesso');
    console.log('👤 Usuário:', signUpData.user?.email);
    console.log('🔑 ID do usuário:', signUpData.user?.id);
    
    // Aguardar um pouco para o perfil ser criado
    console.log('⏳ Aguardando criação do perfil...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fazer login (mesmo sem confirmação de email, vamos tentar)
    console.log('\n🔄 Fazendo login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      
      // Se o erro for de email não confirmado, vamos tentar confirmar manualmente
      if (loginError.message.includes('Email not confirmed')) {
        console.log('📧 Tentando confirmar email manualmente...');
        
        // Usar service role para confirmar o email
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
        
        // Atualizar o usuário para confirmar o email
        const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
          signUpData.user.id,
          { email_confirm: true }
        );
        
        if (updateError) {
          console.error('❌ Erro ao confirmar email:', updateError.message);
          return;
        }
        
        console.log('✅ Email confirmado manualmente');
        
        // Tentar login novamente
        const { data: retryLoginData, error: retryLoginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (retryLoginError) {
          console.error('❌ Erro no segundo login:', retryLoginError.message);
          return;
        }
        
        console.log('✅ Login realizado com sucesso após confirmação');
      } else {
        return;
      }
    } else {
      console.log('✅ Login realizado com sucesso');
    }
    
    // Obter sessão atual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ Nenhuma sessão ativa encontrada');
      return;
    }
    
    console.log('✅ Sessão ativa encontrada');
    console.log('🔑 Token de acesso disponível');
    
    // Agora testar a Edge Function
    console.log('\n🔄 Testando Edge Function...');
    
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId: process.env.VITE_STRIPE_MONTHLY_PRICE_ID,
        userId: session.user.id,
        userEmail: session.user.email,
        successUrl: 'http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: 'http://localhost:5173/pricing'
      }
    });
    
    if (error) {
      console.error('❌ Erro da Edge Function:', error);
      return;
    }
    
    if (data && data.sessionId) {
      console.log('✅ Edge Function funcionou!');
      console.log('🔗 Session ID:', data.sessionId);
      console.log('✅ Teste bem-sucedido!');
    } else {
      console.error('❌ Resposta inválida da Edge Function:', data);
    }
    
    // Fazer logout
    console.log('\n🚪 Fazendo logout...');
    await supabase.auth.signOut();
    console.log('🚪 Logout realizado');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testCheckoutWithAuth().catch(console.error);