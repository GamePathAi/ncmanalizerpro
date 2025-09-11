import fs from 'fs';
import path from 'path';

console.log('🔍 Debug de Arquivos .env');
console.log('==================================================');

// Lista de possíveis arquivos .env
const envFiles = [
  '.env',
  '.env.local', 
  '.env.development',
  '.env.production',
  'supabase/.env'
];

envFiles.forEach(envFile => {
  const envPath = path.join(process.cwd(), envFile);
  
  if (fs.existsSync(envPath)) {
    console.log(`\n📄 Arquivo: ${envFile}`);
    console.log(`📍 Caminho: ${envPath}`);
    
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const resendMatch = content.match(/RESEND_API_KEY=(.+)/);
      
      if (resendMatch) {
        const key = resendMatch[1].trim();
        console.log(`🔑 RESEND_API_KEY: ${key.substring(0, 20)}...`);
        console.log(`📏 Tamanho: ${key.length} caracteres`);
      } else {
        console.log('❌ RESEND_API_KEY não encontrada');
      }
    } catch (error) {
      console.log(`❌ Erro ao ler: ${error.message}`);
    }
  } else {
    console.log(`\n📄 Arquivo: ${envFile} - ❌ NÃO EXISTE`);
  }
});

// Verificar variáveis de ambiente carregadas
console.log('\n🔄 Variáveis de Ambiente Carregadas:');
console.log('==================================================');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 20) + '...' : 'NÃO DEFINIDA'}`);

// Tentar carregar manualmente com dotenv
console.log('\n🔄 Testando dotenv manual:');
console.log('==================================================');

try {
  // Limpar cache do dotenv
  delete require.cache[require.resolve('dotenv')];
  
  const dotenv = await import('dotenv');
  const result = dotenv.config();
  
  console.log('✅ dotenv.config() executado');
  console.log(`📋 Parsed keys: ${Object.keys(result.parsed || {}).length}`);
  
  if (result.parsed && result.parsed.RESEND_API_KEY) {
    console.log(`🔑 RESEND_API_KEY via dotenv: ${result.parsed.RESEND_API_KEY.substring(0, 20)}...`);
  } else {
    console.log('❌ RESEND_API_KEY não encontrada via dotenv');
  }
  
} catch (error) {
  console.log(`❌ Erro com dotenv: ${error.message}`);
}

// Verificar se há conflitos de cache
console.log('\n🧹 Cache do Node.js:');
console.log('==================================================');
const cacheKeys = Object.keys(require.cache).filter(key => key.includes('.env'));
console.log(`📦 Arquivos .env em cache: ${cacheKeys.length}`);
cacheKeys.forEach(key => console.log(`   - ${key}`));