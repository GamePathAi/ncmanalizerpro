// Teste de signup sem confirmação de email
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis do .env
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSignupSemEmail() {
  console.log('🧪 Testando signup sem confirmação de email...');
  console.log('');
  
  const testEmail = `no-email-${Date.now()}@example.com`;
  const testPassword = 'test123456';
  const testName = 'Teste Sem Email';
  
  console.log('📧 Email de teste:', testEmail);
  console.log('🔑 Senha:', testPassword);
  console.log('👤 Nome:', testName);
  console.log('');
  
  try {
    console.log('🚀 Tentando signup sem confirmação de email...');
    
    // Tentar signup com emailRedirectTo null para evitar envio de email
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        },
        emailRedirectTo: null // Tentar evitar envio de email
      }
    });
    
    if (error) {
      console.log('❌ Erro no signup:', error.message);
      console.log('🔍 Código do erro:', error.status || 'N/A');
      
      if (error.message.includes('confirmation email')) {
        console.log('');
        console.log('💡 SOLUÇÃO TEMPORÁRIA:');
        console.log('1. Desabilitar confirmação de email no Supabase temporariamente');
        console.log('2. Corrigir a API key do Resend');
        console.log('3. Reabilitar confirmação de email');
        console.log('');
        console.log('🔧 Para desabilitar confirmação:');
        console.log('   - Vá para: Authentication > Settings no dashboard do Supabase');
        console.log('   - Desmarque "Enable email confirmations"');
        console.log('   - Salve as configurações');
      }
      
      return false;
    }
    
    if (data.user) {
      console.log('✅ Signup realizado com sucesso!');
      console.log('👤 Usuário criado:', data.user.id);
      console.log('📧 Email:', data.user.email);
      console.log('✉️ Email confirmado:', data.user.email_confirmed_at ? 'Sim' : 'Não');
      
      // Verificar se o usuário foi criado na tabela user_profiles
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.log('⚠️ Erro ao buscar perfil:', profileError.message);
      } else if (profile) {
        console.log('👤 Perfil criado:', profile.subscription_status);
      } else {
        console.log('⚠️ Perfil não encontrado');
      }
      
      return true;
    } else {
      console.log('⚠️ Signup executado mas usuário não retornado');
      return false;
    }
    
  } catch (err) {
    console.log('❌ Erro inesperado:', err.message);
    return false;
  }
}

// Executar teste
testSignupSemEmail().then(success => {
  console.log('');
  if (success) {
    console.log('🎯 RESULTADO: Signup funcionou sem confirmação de email!');
    console.log('💡 Agora você pode testar o frontend com confirmação desabilitada.');
  } else {
    console.log('💥 RESULTADO: Problema persiste mesmo sem confirmação de email!');
  }
  
  console.log('');
  console.log('🔧 Próximos passos:');
  console.log('1. Se funcionou: desabilitar confirmação temporariamente');
  console.log('2. Corrigir API key do Resend');
  console.log('3. Reabilitar confirmação de email');
  console.log('4. Testar novamente o fluxo completo');
}).catch(err => {
  console.log('💥 Erro fatal no teste:', err.message);
});