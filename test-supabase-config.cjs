const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('=== TESTE DE CONFIGURAÇÃO SUPABASE ===');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Definida' : 'Não definida');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    // Teste de conexão básica
    console.log('\n=== TESTE DE CONEXÃO ===');
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
    } else {
      console.log('✅ Conexão com Supabase funcionando!');
    }
  } catch (err) {
    console.error('❌ Erro ao conectar:', err.message);
  }

  try {
    // Teste de signup
    console.log('\n=== TESTE DE SIGNUP ===');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test123456'
    });
    
    if (error) {
      console.error('❌ Erro no signup:', error.message);
    } else {
      console.log('✅ Signup funcionando:', data.user ? 'Usuário criado' : 'Resposta recebida');
    }
  } catch (err) {
    console.error('❌ Erro no teste de signup:', err.message);
  }
}

testSupabase();