require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 TESTE DE SENHA ESPECÍFICA');
console.log('Email: gamepathai@gmail.com');
console.log('Senha: Efanob!123');

async function testarSenhaEspecifica() {
  const email = 'gamepathai@gmail.com';
  const senha = 'Efanob!123';
  
  try {
    console.log('\n🔐 Testando login...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });
    
    if (error) {
      console.log('❌ Erro no login:', error.message);
      console.log('Código do erro:', error.status);
      
      // Verificar se o usuário existe
      console.log('\n🔍 Verificando se o usuário existe...');
      
      // Tentar cadastrar com essa senha para ver se o usuário não existe
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: senha
      });
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          console.log('✅ Usuário existe, mas senha está incorreta');
        } else {
          console.log('❌ Erro no cadastro:', signUpError.message);
        }
      } else {
        console.log('✅ Usuário foi criado com sucesso! (não existia antes)');
        console.log('User ID:', signUpData.user?.id);
      }
    } else {
      console.log('\n🎉 LOGIN REALIZADO COM SUCESSO!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      console.log('Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
      console.log('\n✅ A senha Efanob!123 está correta!');
    }
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

testarSenhaEspecifica();