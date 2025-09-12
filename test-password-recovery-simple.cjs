const http = require('http');

// Testar a função de recuperação de senha
async function testPasswordRecovery() {
  try {
    console.log('🧪 Testando recuperação de senha...');
    
    const postData = JSON.stringify({
      email: 'igor.bonafe@gmail.com'
    });

    const options = {
      hostname: '127.0.0.1',
      port: 54321,
      path: '/functions/v1/password-recovery',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNx_kzKJGUGpVyMVqBpTHhNkkdMU',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Resposta:', data);
        
        try {
          const result = JSON.parse(data);
          console.log('JSON:', result);
        } catch (e) {
          console.log('Não é JSON válido');
        }
      });
    });

    req.on('error', (e) => {
      console.error('Erro na requisição:', e.message);
    });

    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testPasswordRecovery();