require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 TESTE DO USUÁRIO ORIGINAL');
console.log('Email: gamepathai@gmail.com');

// Lista de senhas mais comuns para testar
const senhasPossiveis = [
  'TesteSenha123!',
  'password123',
  'Password123',
  'teste123',
  '123456',
  'password',
  'senha123',
  'Senha123',
  'gamepathai',
  'Gamepathai123',
  'admin123',
  'Admin123',
  'ncmpro123',
  'NCMPro123',
  'supabase123',
  'Supabase123'
];

async function testarSenhas() {
  const email = 'gamepathai@gmail.com';
  
  console.log('\n🔍 Testando senhas possíveis...');
  
  for (const senha of senhasPossiveis) {
    try {
      console.log(`🔐 Testando: ${senha.substring(0, 3)}${'*'.repeat(senha.length - 3)}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });
      
      if (!error && data.user) {
        console.log(`\n✅ SENHA ENCONTRADA: ${senha}`);
        console.log('User ID:', data.user.id);
        console.log('Email confirmado:', data.user.email_confirmed_at ? 'Sim' : 'Não');
        return;
      }
    } catch (err) {
      // Continua testando
    }
    
    // Pequena pausa para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n❌ Nenhuma senha funcionou.');
  console.log('\n💡 Sugestões:');
  console.log('1. Criar um novo usuário para testes');
  console.log('2. Usar o reset de senha se implementado');
  console.log('3. Verificar se o usuário existe no banco');
}

testarSenhas();