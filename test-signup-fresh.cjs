const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Debug: verificar se as variáveis foram carregadas
console.log('🔍 Verificando variáveis de ambiente...');
console.log('URL:', process.env.VITE_SUPABASE_URL ? 'Carregada' : 'Não encontrada');
console.log('Key:', process.env.VITE_SUPABASE_ANON_KEY ? 'Carregada' : 'Não encontrada');

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testFreshSignup() {
  console.log('🧪 Testando cadastro com email único...');
  
  // Gerar email único com timestamp
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 10000);
  const testEmail = `fresh-test-${timestamp}-${randomId}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log(`📧 Email de teste: ${testEmail}`);
  
  try {
    console.log('1. Tentando cadastro...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Teste Usuario',
          company: 'Empresa Teste'
        }
      }
    });
    
    if (error) {
      console.log('❌ Erro no cadastro:');
      console.log('Mensagem:', error.message);
      console.log('Código:', error.status);
      console.log('Tipo:', error.name);
      return;
    }
    
    console.log('✅ Cadastro realizado com sucesso!');
    console.log('👤 Usuário:', data.user?.email);
    console.log('🔑 ID:', data.user?.id);
    console.log('📧 Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
    
    // Verificar se o perfil foi criado
    console.log('\n2. Verificando perfil criado...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
    } else {
      console.log('✅ Perfil encontrado!');
      console.log('📋 Dados do perfil:', {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        company: profile.company,
        totp_enabled: profile.totp_enabled
      });
    }
    
  } catch (err) {
    console.log('❌ Erro inesperado:', err.message);
  }
}

testFreshSignup();