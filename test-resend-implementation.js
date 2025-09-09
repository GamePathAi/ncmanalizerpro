import { Resend } from 'resend';

// Implementação do Resend conforme código fornecido
const resend = new Resend('re_43kupGy2_KP49rUxy9V9WF2oa1BhoXvqj');

// Função para enviar email de teste
async function sendTestEmail() {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'gamepathai@gmail.com',
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
    });
    
    console.log('Email enviado com sucesso:', result);
    return result;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

// Função para enviar email personalizado
async function sendCustomEmail(to, subject, htmlContent) {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: to,
      subject: subject,
      html: htmlContent
    });
    
    console.log('Email personalizado enviado:', result);
    return result;
  } catch (error) {
    console.error('Erro ao enviar email personalizado:', error);
    throw error;
  }
}

// Exportar funções para uso
export { sendTestEmail, sendCustomEmail };

// Para testar diretamente (descomente a linha abaixo)
// sendTestEmail();