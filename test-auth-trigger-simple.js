import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAuthTrigger() {
  console.log('🧪 Testando trigger de criação de usuário...');
  
  const testEmail = `trigger-test-${Date.now()}@exemplo.com`;
  const testPassword = 'TestPassword123!';
  const testFullName = 'Usuário Teste Trigger';
  
  console.log('📧 Email de teste:', testEmail);
  console.log('👤 Nome completo:', testFullName);
  
  try {
    // Tentar cadastrar usuário
    console.log('\n🔄 Iniciando cadastro...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName
        }
      }
    });
    
    if (authError) {
      console.log('❌ Erro no cadastro de usuário:');
      console.log('Mensagem:', authError.message);
      console.log('Código:', authError.status || 'N/A');
      console.log('Detalhes completos:', JSON.stringify(authError, null, 2));
      return;
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('🆔 ID do usuário:', authData.user?.id);
    console.log('📧 Email confirmado:', authData.user?.email_confirmed_at ? 'Sim' : 'Não');
    
    // Aguardar um pouco para o trigger executar
    console.log('\n⏳ Aguardando trigger executar...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se o perfil foi criado
    console.log('\n🔍 Verificando se o perfil foi criado...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao buscar perfil:');
      console.log('Mensagem:', profileError.message);
      console.log('Código:', profileError.code);
      console.log('\n🔍 Isso indica que o trigger NÃO está funcionando!');
    } else {
      console.log('✅ Perfil encontrado! Trigger está funcionando!');
      console.log('📋 Dados do perfil:');
      console.log('- ID:', profileData.id);
      console.log('- Email:', profileData.email);
      console.log('- Nome:', profileData.full_name);
      console.log('- Tipo de assinatura:', profileData.subscription_type);
      console.log('- Status da assinatura:', profileData.subscription_status);
      console.log('- TOTP habilitado:', profileData.totp_enabled);
    }
    
    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    // Deletar perfil se existir
    if (!profileError) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', authData.user.id);
      console.log('✅ Perfil de teste removido.');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testAuthTrigger();