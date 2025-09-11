import { config } from 'dotenv';
import fetch from 'node-fetch';

// Carregar variáveis do .env
config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

console.log('🧪 Teste Direto da API do Resend');
console.log('==================================================');
console.log(`🔑 API Key (primeiros 20): ${RESEND_API_KEY ? RESEND_API_KEY.substring(0, 20) + '...' : 'NÃO ENCONTRADA'}`);

if (!RESEND_API_KEY) {
  console.log('❌ RESEND_API_KEY não encontrada no .env');
  process.exit(1);
}

async function testResendAPI() {
  try {
    console.log('\n📧 Testando envio de email via Resend...');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'NCM Analyzer Pro <onboarding@resend.dev>',
        to: ['test@example.com'],
        subject: '🧪 Teste da API Resend',
        html: `
          <h1>Teste de Conectividade</h1>
          <p>Este é um teste para verificar se a API key do Resend está funcionando.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `
      })
    });

    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Resposta:`, JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ API key do Resend está VÁLIDA!');
      console.log('🎯 O problema está na configuração do Supabase');
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. Acessar: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/settings/functions');
      console.log('2. Adicionar variável: RESEND_API_KEY');
      console.log(`3. Valor: ${RESEND_API_KEY}`);
      console.log('4. Salvar e redeployar as functions');
    } else {
      console.log('❌ API key do Resend está INVÁLIDA!');
      console.log('🔧 Gerar nova API key em: https://resend.com/api-keys');
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar Resend:', error.message);
  }
}

testResendAPI();