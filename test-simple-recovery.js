import fetch from 'node-fetch';

const LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testSimple() {
  console.log('🔍 Teste Simples da Função de Recuperação');
  
  try {
    const response = await fetch('http://127.0.0.1:54321/functions/v1/password-recovery/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCAL_ANON_KEY}`,
      },
      body: JSON.stringify({ email: 'test@example.com' })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers));
    
    const text = await response.text();
    console.log('Response:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('JSON:', json);
    } catch (e) {
      console.log('Não é JSON válido');
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testSimple();