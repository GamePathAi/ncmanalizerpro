// Teste de cadastro sem confirmação de email
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsntzljufghutoyqxokm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTY0MDEsImV4cCI6MjA2OTE3MjQwMX0.MTkYFy_FfnGOiHrDVjV3AWDYao8YLQf1TnnBWeJwG-I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUpNoEmail() {
  console.log('🧪 Testando cadastro SEM confirmação de email...');
  
  const testEmail = `no-email-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    console.log('📧 Tentando cadastrar:', testEmail);
    
    // Cadastro sem emailRedirectTo para evitar envio de email
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Teste Sem Email'
        }
        // Removendo emailRedirectTo para não tentar enviar email
      }
    });
    
    if (error) {
      console.error('❌ Erro no cadastro:', error.message);
      console.error('🔍 Tipo do erro:', error.name);
      console.error('🔍 Código do erro:', error.status);
      console.error('🔍 Detalhes completos:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('✅ Cadastro realizado com sucesso!');
    console.log('👤 Usuário criado:', data.user?.id);
    console.log('📧 Email:', data.user?.email);
    console.log('🔗 Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
    console.log('📋 Sessão criada:', data.session ? 'Sim' : 'Não');
    
    // Aguardar um pouco para o trigger criar o perfil
    console.log('⏳ Aguardando criação do perfil...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se o perfil foi criado
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError.message);
      console.error('💡 Possível causa: Trigger não funcionou ou políticas RLS');
      return false;
    }
    
    console.log('✅ Perfil criado automaticamente!');
    console.log('📋 Dados do perfil:');
    console.log('  - ID:', profile.id);
    console.log('  - Email:', profile.email);
    console.log('  - Nome:', profile.full_name);
    console.log('  - Tipo assinatura:', profile.subscription_type);
    console.log('  - Status assinatura:', profile.subscription_status);
    console.log('  - TOTP habilitado:', profile.totp_enabled);
    
    return true;
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    console.error('🔍 Stack trace:', err.stack);
    return false;
  }
}

async function runTest() {
  console.log('🚀 Testando cadastro sem confirmação de email...');
  
  const success = await testSignUpNoEmail();
  
  if (success) {
    console.log('🎉 Teste passou! O problema é o envio de email de confirmação.');
    console.log('💡 Solução: Desabilitar confirmação de email ou configurar SMTP no Supabase.');
  } else {
    console.log('❌ Teste falhou. Há outros problemas além do email.');
  }
}

runTest().catch(console.error);