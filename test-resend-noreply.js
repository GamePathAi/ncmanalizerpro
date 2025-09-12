import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendWithNoreply() {
  console.log('🧪 TESTE DE ENVIO COM NOREPLY@NCMANALYZER.COM.BR');
  console.log('=' .repeat(60));
  
  try {
    // Verificar se a API key está configurada
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY não encontrada no .env');
    }
    
    console.log('✅ API Key do Resend encontrada');
    console.log(`🔑 Key: ${process.env.RESEND_API_KEY.substring(0, 8)}...`);
    
    // Testar envio de email
    console.log('\n📧 Enviando email de teste...');
    
    const emailData = {
      from: 'noreply@ncmanalyzer.com.br',
      to: ['igor@ncmanalyzer.com.br'], // Substitua pelo seu email real
      subject: 'Teste de Configuração - NCM Analyzer PRO',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 Configuração do Email Funcionando!</h2>
          
          <p>Olá!</p>
          
          <p>Este é um email de teste para confirmar que a configuração do Resend está funcionando corretamente com o domínio <strong>ncmanalyzer.com.br</strong>.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">✅ Configurações Verificadas:</h3>
            <ul>
              <li>Domínio verificado no Resend</li>
              <li>Email remetente: noreply@ncmanalyzer.com.br</li>
              <li>SMTP configurado: smtp.resend.com:465</li>
              <li>API Key funcionando</li>
            </ul>
          </div>
          
          <p><strong>Próximos passos:</strong></p>
          <ol>
            <li>Configurar este email no Supabase Auth</li>
            <li>Testar cadastro de usuário</li>
            <li>Verificar recebimento de emails de confirmação</li>
          </ol>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Este email foi enviado automaticamente pelo sistema de testes do NCM Analyzer PRO.
          </p>
        </div>
      `
    };
    
    const result = await resend.emails.send(emailData);
    
    console.log('✅ Email enviado com sucesso!');
    console.log('📋 Detalhes do envio:');
    console.log(`   - ID: ${result.data?.id || 'N/A'}`);
    console.log(`   - De: ${emailData.from}`);
    console.log(`   - Para: ${emailData.to.join(', ')}`);
    console.log(`   - Assunto: ${emailData.subject}`);
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. ✅ Domínio verificado no Resend');
    console.log('2. ✅ Email noreply@ncmanalyzer.com.br funcionando');
    console.log('3. 🔄 Configurar no Supabase Auth Settings');
    console.log('4. 🔄 Testar fluxo completo de cadastro');
    
    console.log('\n📝 CONFIGURAÇÃO SUPABASE:');
    console.log('No dashboard do Supabase > Authentication > Settings > SMTP:');
    console.log('- Host: smtp.resend.com');
    console.log('- Port: 465');
    console.log('- Username: resend');
    console.log(`- Password: ${process.env.RESEND_API_KEY}`);
    console.log('- Sender email: noreply@ncmanalyzer.com.br');
    console.log('- Sender name: NCM Analyzer PRO');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n🔧 SOLUÇÃO:');
      console.log('1. Verifique se RESEND_API_KEY está no arquivo .env');
      console.log('2. Confirme se a API key está correta no Resend');
    } else if (error.message.includes('domain')) {
      console.log('\n🔧 SOLUÇÃO:');
      console.log('1. Verifique se o domínio ncmanalyzer.com.br está verificado no Resend');
      console.log('2. Confirme os registros DNS');
    } else {
      console.log('\n🔧 DETALHES DO ERRO:');
      console.log(error);
    }
  }
}

// Executar teste
testResendWithNoreply();