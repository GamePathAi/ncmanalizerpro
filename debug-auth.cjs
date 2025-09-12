require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 DEBUG DETALHADO DE AUTENTICAÇÃO');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Configurada' : 'NÃO CONFIGURADA');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuth() {
  try {
    console.log('\n🧪 TESTE 1: Verificar conexão com Supabase');
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
    } else {
      console.log('✅ Conexão OK');
    }

    console.log('\n🧪 TESTE 2: Cadastro básico');
    const email = `teste${Date.now()}@exemplo.com`;
    const password = 'TesteSenha123!';
    
    console.log('📧 Email:', email);
    console.log('🔐 Senha:', password);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (signUpError) {
      console.log('❌ Erro no cadastro:', signUpError.message);
      console.log('Código do erro:', signUpError.status);
      console.log('Detalhes completos:', JSON.stringify(signUpError, null, 2));
    } else {
      console.log('✅ Cadastro realizado com sucesso!');
      console.log('User ID:', signUpData.user?.id);
      console.log('Email confirmado:', signUpData.user?.email_confirmed_at ? 'Sim' : 'Não');
    }

    console.log('\n🧪 TESTE 3: Verificar se usuário foi criado no banco');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('email, created_at')
      .eq('email', email);
    
    if (usersError) {
      console.log('❌ Erro ao consultar usuários:', usersError.message);
    } else {
      console.log('👥 Usuários encontrados:', users?.length || 0);
    }

    console.log('\n🧪 TESTE 4: Login com o usuário criado');
    if (signUpData?.user) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (loginError) {
        console.log('❌ Erro no login:', loginError.message);
      } else {
        console.log('✅ Login realizado com sucesso!');
      }
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

debugAuth();