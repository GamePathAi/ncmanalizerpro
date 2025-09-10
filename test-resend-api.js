import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendAPI() {
  console.log('🧪 Testando API Key do Resend...');
  console.log('📧 API Key:', process.env.RESEND_API_KEY);
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['gamepathai@gmail.com'], // Seu email autorizado
      subject: 'Teste API Resend - NCM Pro',
      html: '<p>✅ Teste de conectividade com Resend funcionando!</p>',
    });

    if (error) {
      console.log('❌ Erro na API do Resend:', error);
      return false;
    }

    console.log('✅ Email enviado com sucesso! ID:', data.id);
    return true;
  } catch (error) {
    console.log('❌ Erro ao testar API:', error.message);
    return false;
  }
}

testResendAPI();