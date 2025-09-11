// Teste das variáveis de ambiente no frontend
import dotenv from 'dotenv';

// Carregar variáveis do .env
dotenv.config();

console.log('🔍 Testando variáveis de ambiente...');
console.log('');

// Testar variáveis do Supabase
console.log('📋 VARIÁVEIS DO SUPABASE:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL || 'NÃO DEFINIDA');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('');

// Testar outras variáveis importantes
console.log('📋 OUTRAS VARIÁVEIS:');
console.log('VITE_STRIPE_PUBLISHABLE_KEY:', process.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('');

// Testar conectividade básica com Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  console.log('🧪 Testando conectividade com Supabase...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Teste simples de conectividade
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Erro na conectividade:', error.message);
    } else {
      console.log('✅ Conectividade com Supabase OK');
    }
  } catch (err) {
    console.log('❌ Erro ao testar conectividade:', err.message);
  }
} else {
  console.log('❌ Não foi possível testar conectividade - variáveis ausentes');
}

console.log('');
console.log('🔧 Se houver problemas:');
console.log('1. Verifique se as variáveis estão no arquivo .env');
console.log('2. Reinicie o servidor de desenvolvimento');
console.log('3. Verifique se as URLs estão corretas');