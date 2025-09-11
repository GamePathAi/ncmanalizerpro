import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

console.log('🧪 Teste Resend com Email Autorizado');
console.log('==================================================');
console.log(`🔑 API Key (primeiros 20): ${RESEND_API_KEY ? RESEND_API_KEY.substring(0, 20) + '...' : 'NÃO ENCONTRADA'}`);

if (!RESEND_API_KEY) {
  console.log('❌ RESEND_API_KEY não encontrada no .env');
  process.exit(1);
}

async function testResendWithAuthorizedEmail() {
  try {
    console.log('\n📧 Testando envio para email autorizado...');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'NCM Analyzer Pro <onboarding@resend.dev>',
        to: ['gamepathai@gmail.com'], // Email autorizado
        subject: '✅ Teste de Confirmação - NCM Analyzer Pro',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; text-align: center;">🎉 API Resend Funcionando!</h1>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e40af; margin-top: 0;">Confirmação de Email</h2>
              <p>Parabéns! Sua API key do Resend está funcionando corretamente.</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>API Key:</strong> ${RESEND_API_KEY.substring(0, 10)}...</p>
            </div>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #059669; margin-top: 0;">✅ Próximos Passos</h3>
              <ol style="color: #065f46;">
                <li>Configurar a API key no Supabase Dashboard</li>
                <li>Redeployar as Edge Functions</li>
                <li>Testar o fluxo completo de signup</li>
                <li>Verificar domínio personalizado (opcional)</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">NCM Analyzer Pro - Sistema de Autenticação</p>
            </div>
          </div>
        `
      })
    });

    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Resposta:`, JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n🎉 SUCESSO! API key do Resend está FUNCIONANDO!');
      console.log('📧 Email enviado com sucesso para gamepathai@gmail.com');
      console.log(`📨 ID do Email: ${result.id}`);
      
      console.log('\n📋 PRÓXIMOS PASSOS OBRIGATÓRIOS:');
      console.log('==================================================');
      console.log('1. 🔧 Configurar no Supabase Dashboard:');
      console.log('   - Acessar: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/settings/functions');
      console.log('   - Adicionar variável: RESEND_API_KEY');
      console.log(`   - Valor: ${RESEND_API_KEY}`);
      console.log('\n2. 🚀 Redeployar Edge Functions:');
      console.log('   - Executar: supabase functions deploy');
      console.log('\n3. 🧪 Testar signup completo:');
      console.log('   - Executar: node test-signup-simple.js');
      console.log('\n4. 🌐 (Opcional) Verificar domínio personalizado:');
      console.log('   - Acessar: https://resend.com/domains');
      console.log('   - Configurar domínio próprio para envios em produção');
      
    } else if (response.status === 403) {
      console.log('\n⚠️  RESTRIÇÃO DE EMAIL DETECTADA');
      console.log('📧 A API key funciona, mas há limitações:');
      console.log('   - Só pode enviar para: gamepathai@gmail.com');
      console.log('   - Para outros emails, precisa verificar domínio');
      console.log('\n🔧 SOLUÇÕES:');
      console.log('1. Usar gamepathai@gmail.com para testes');
      console.log('2. Verificar domínio em: https://resend.com/domains');
      
    } else {
      console.log('❌ Erro no envio de email');
      console.log('🔧 Verificar configurações da API key');
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar Resend:', error.message);
  }
}

testResendWithAuthorizedEmail();