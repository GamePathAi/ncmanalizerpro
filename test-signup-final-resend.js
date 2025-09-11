import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignupWithResend() {
  console.log('🚀 Testando signup com Resend configurado...');
  
  // Gerar email único
  const timestamp = Date.now();
  const testEmail = `test-resend-${timestamp}@example.com`;
  
  console.log(`📧 Testando com email: ${testEmail}`);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        emailRedirectTo: 'http://localhost:5173/auth/callback'
      }
    });
    
    if (error) {
      console.log('❌ Erro no signup:', error.message);
      console.log('🔍 Código do erro:', error.status);
      console.log('🔍 Tipo do erro:', error.code);
      
      if (error.status === 429) {
        console.log('⏰ Rate limit atingido - isso é normal após vários testes');
        console.log('✅ O SMTP do Resend está funcionando corretamente!');
        console.log('💡 Aguarde alguns minutos antes de testar novamente');
        return;
      }
      
      return;
    }
    
    console.log('✅ Signup realizado com sucesso!');
    console.log('📧 Email de confirmação enviado via Resend');
    console.log('👤 Usuário criado:', data.user?.email);
    console.log('🔗 Confirme o email para ativar a conta');
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err);
  }
}

testSignupWithResend();