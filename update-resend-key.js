import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Carregar variáveis do .env atual
config();

console.log('🔧 Atualizador de API Key do Resend');
console.log('==================================================');

// Nova API key baseada no dashboard do Supabase (primeiros caracteres visíveis)
// Você precisa substituir por uma API key válida do Resend
const NEW_RESEND_API_KEY = 're_SEU_NOVA_API_KEY_AQUI';

const envPath = path.join(process.cwd(), '.env');

try {
  // Ler o arquivo .env atual
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('📄 Arquivo .env encontrado');
  console.log(`🔑 API Key atual: ${process.env.RESEND_API_KEY?.substring(0, 20)}...`);
  
  // Substituir a linha da RESEND_API_KEY
  const updatedContent = envContent.replace(
    /RESEND_API_KEY=.*/,
    `RESEND_API_KEY=${NEW_RESEND_API_KEY}`
  );
  
  // Verificar se a substituição foi feita
  if (updatedContent === envContent) {
    console.log('⚠️  Linha RESEND_API_KEY não encontrada, adicionando...');
    const finalContent = envContent + `\nRESEND_API_KEY=${NEW_RESEND_API_KEY}\n`;
    fs.writeFileSync(envPath, finalContent);
  } else {
    fs.writeFileSync(envPath, updatedContent);
  }
  
  console.log('✅ Arquivo .env atualizado com sucesso!');
  console.log(`🔑 Nova API Key: ${NEW_RESEND_API_KEY.substring(0, 20)}...`);
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Substituir "re_SEU_NOVA_API_KEY_AQUI" por uma API key válida do Resend');
  console.log('2. Gerar nova API key em: https://resend.com/api-keys');
  console.log('3. Configurar a mesma chave no Supabase Dashboard');
  console.log('4. Testar com: node test-resend-direct.js');
  
} catch (error) {
  console.error('❌ Erro ao atualizar .env:', error.message);
}

console.log('\n🔗 LINKS ÚTEIS:');
console.log('- Resend Dashboard: https://resend.com/dashboard');
console.log('- Supabase Functions: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/settings/functions');
console.log('\n⚠️  IMPORTANTE: Mantenha sua API key segura e nunca a compartilhe!');