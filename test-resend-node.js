// Teste da implementação do Resend - Node.js
import { Resend } from 'resend';

// Configuração do Resend com a API key fornecida
const resend = new Resend('re_43kupGy2_KP49rUxy9V9WF2oa1BhoXvqj');

// Função principal de teste
async function testResendImplementation() {
  console.log('🚀 Iniciando teste da implementação do Resend...');
  
  try {
    // Teste básico conforme código fornecido
    console.log('📧 Enviando email de teste...');
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'gamepathai@gmail.com',
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
    });
    
    console.log('✅ Email enviado com sucesso!');
    console.log('📋 Resultado:', JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    
    // Verificar tipos de erro comuns
    if (error.message.includes('API key')) {
      console.log('💡 Dica: Verifique se a API key está correta');
    } else if (error.message.includes('domain')) {
      console.log('💡 Dica: Verifique se o domínio está verificado no Resend');
    } else if (error.message.includes('rate limit')) {
      console.log('💡 Dica: Limite de taxa atingido, tente novamente mais tarde');
    }
    
    throw error;
  }
}

// Função para testar com diferentes configurações
async function testCustomEmail() {
  console.log('\n🔧 Testando email personalizado...');
  
  try {
    const customResult = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'gamepathai@gmail.com',
      subject: 'Teste de Implementação - NCM Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🎉 Implementação do Resend Funcionando!</h2>
          <p>Este email confirma que a implementação do Resend está funcionando corretamente no projeto NCM Pro.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Detalhes da Implementação:</h3>
            <ul>
              <li>✅ API Key configurada</li>
              <li>✅ Envio de email funcionando</li>
              <li>✅ HTML personalizado suportado</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 12px;">Enviado via Resend API - NCM Pro App</p>
        </div>
      `
    });
    
    console.log('✅ Email personalizado enviado!');
    console.log('📋 Resultado:', JSON.stringify(customResult, null, 2));
    
    return customResult;
    
  } catch (error) {
    console.error('❌ Erro no email personalizado:', error.message);
    throw error;
  }
}

// Executar testes
async function runAllTests() {
  try {
    await testResendImplementation();
    await testCustomEmail();
    
    console.log('\n🎊 Todos os testes concluídos com sucesso!');
    console.log('💡 A implementação do Resend está funcionando corretamente.');
    
  } catch (error) {
    console.log('\n💥 Falha nos testes:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  runAllTests();
}

// Executar automaticamente
runAllTests();

export {
  testResendImplementation,
  testCustomEmail,
  runAllTests
};