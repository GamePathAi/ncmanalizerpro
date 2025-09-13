require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Usar Service Role Key para bypass RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSimpleTestUser() {
  console.log('🧪 Criando usuário de teste simples...');
  
  const testEmail = 'test@example.com';
  const testPassword = 'TestPassword123!';
  
  try {
    // 1. Criar usuário via Auth Admin API
    console.log('📧 Criando usuário:', testEmail);
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Confirmar email automaticamente
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️ Usuário já existe, tentando fazer login...');
        
        // Testar login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (loginError) {
          console.log('❌ Erro no login:', loginError.message);
          return false;
        } else {
          console.log('✅ Login funcionou! Usuário:', loginData.user.email);
          return true;
        }
      } else {
        console.log('❌ Erro ao criar usuário:', authError.message);
        return false;
      }
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('👤 User ID:', authData.user.id);
    console.log('📧 Email:', authData.user.email);
    
    // 2. Criar perfil básico (apenas com colunas que existem)
    console.log('\n📋 Criando perfil...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        subscription_status: 'active',
        email_verified_at: new Date().toISOString(),
        stripe_customer_id: 'cus_test_' + Date.now()
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao criar perfil:', profileError.message);
      console.log('📋 Detalhes:', profileError);
    } else {
      console.log('✅ Perfil criado com sucesso!');
      console.log('📊 Dados do perfil:', profileData);
    }
    
    // 3. Testar login
    console.log('\n🔐 Testando login...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      return false;
    } else {
      console.log('✅ Login funcionou!');
      console.log('👤 Usuário logado:', loginData.user.email);
      return true;
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    return false;
  }
}

// Executar
createSimpleTestUser().then(success => {
  console.log('\n==================================================');
  if (success) {
    console.log('✅ USUÁRIO DE TESTE CRIADO E TESTADO COM SUCESSO!');
    console.log('🔑 Credenciais para teste no frontend:');
    console.log('   Email: test@example.com');
    console.log('   Senha: TestPassword123!');
  } else {
    console.log('❌ FALHA AO CRIAR/TESTAR USUÁRIO');
  }
  console.log('==================================================');
  process.exit(success ? 0 : 1);
});