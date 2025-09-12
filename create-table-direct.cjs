const https = require('https');

// Configurações do Supabase
const SUPABASE_URL = 'fsntzljufghutoyqxokm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVidW9jbm11aW9qaW5ldmd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5MDc5MCwiZXhwIjoyMDczMTY2NzkwfQ.Bz3rvJLhe-DMbgAohoHN2SlnPNQpnjwelhSNrqHISis';

// SQL para criar a tabela
const createTableSQL = `
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: sql
    });

    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function createTable() {
  try {
    console.log('🔧 Tentando criar tabela password_reset_tokens...');
    
    const result = await executeSQL(createTableSQL);
    console.log('Status:', result.status);
    console.log('Resposta:', result.data);
    
    if (result.status === 200) {
      console.log('✅ Tabela criada com sucesso!');
    } else {
      console.log('❌ Erro ao criar tabela');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createTable();