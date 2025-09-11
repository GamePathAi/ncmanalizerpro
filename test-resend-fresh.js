import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Ler diretamente do arquivo .env sem cache
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extrair RESEND_API_KEY diretamente
const resendKeyMatch = envContent.match(/RESEND_API_KEY=(.+)/);
const RESEND_API_KEY = resendKeyMatch ? resendKeyMatch[1].trim() : null;

console.log('🧪 Teste Fresh da API do Resend (sem cache)');
console.log('==================================================');
console.log(`🔑 API Key (primeiros 20): ${RESEND_API_KEY ? RESEND_API_KEY.substring(0, 20) + '...' : 'NÃO ENCONTRADA'}`);
console.log(`📄 Lida diretamente do arquivo: ${envPath}`);

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
        subject: '🧪 Teste Fresh da API Resend',
        html: `
          <h1>Teste de Conectividade Fresh</h1>
          <p>Este é um teste para verificar se a nova API key do Resend está funcionando.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>API Key: ${RESEND_API_KEY.substring(0, 10)}...</p>
        `
      })
    });

    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Resposta:`, JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ API key do Resend está VÁLIDA!');
      console.log('🎯 Agora precisa configurar no Supabase Dashboard');
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. Acessar: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/settings/functions');
      console.log('2. Adicionar/Atualizar variável: RESEND_API_KEY');
      console.log(`3. Valor: ${RESEND_API_KEY}`);
      console.log('4. Salvar e redeployar as functions');
      console.log('5. Testar signup: node test-signup-simple.js');
    } else {
      console.log('❌ API key do Resend ainda está INVÁLIDA!');
      console.log('🔧 Verificar se a chave foi copiada corretamente');
      console.log('🔧 Gerar nova API key em: https://resend.com/api-keys');
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar Resend:', error.message);
  }
}

testResendAPI();