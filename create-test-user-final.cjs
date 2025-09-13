require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Usar Service Role Key para bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  console.log('🧪 Criando usuário de teste...');
  
  const testEmail = 'test@example.com';
  const testPassword = 'TestPassword123!';
  
  try {
    // 1. Primeiro, vamos verificar se o usuário já existe
    console.log('🔍 Verificando se usuário já existe...');
    
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser.users.find(u => u.email === testEmail);
    
    if (userExists) {
      console.log('⚠️ Usuário já existe, testando login...');
      
      // Testar login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (loginError) {
        console.log('❌ Erro no login:', loginError.message);
        
        // Se o login falhou, vamos deletar e recriar o usuário
        console.log('🗑️ Deletando usuário existente...');
        await supabase.auth.admin.deleteUser(userExists.id);
        
        // Deletar perfil também
        await supabase.from('user_profiles').delete().eq('id', userExists.id);
        
        console.log('✅ Usuário deletado, criando novo...');
      } else {
        console.log('✅ Login funcionou! Usuário já está pronto.');
        console.log('👤 Usuário:', loginData.user.email);
        return true;
      }
    }
    
    // 2. Criar novo usuário
    console.log('👤 Criando novo usuário:', testEmail);
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Confirmar email automaticamente
    });
    
    if (authError) {
      console.log('❌ Erro ao criar usuário:', authError.message);
      return false;
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('👤 User ID:', authData.user.id);
    console.log('📧 Email:', authData.user.email);
    
    // 3. Aguardar um pouco para o trigger funcionar
    console.log('⏳ Aguardando trigger criar perfil...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Verificar se o perfil foi criado pelo trigger
    const { data: profileCheck } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileCheck) {
      console.log('✅ Perfil criado automaticamente pelo trigger!');
      console.log('📊 Dados do perfil:', profileCheck);
    } else {
      console.log('⚠️ Perfil não foi criado pelo trigger, criando manualmente...');
      
      // Criar perfil manualmente com apenas as colunas básicas
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          subscription_status: 'active', // Definir como ativo para teste
          email_verified_at: new Date().toISOString(),
          stripe_customer_id: 'cus_test_' + Date.now()
        })
        .select()
        .single();
      
      if (profileError) {
        console.log('❌ Erro ao criar perfil:', profileError.message);
        console.log('📋 Detalhes:', profileError);
      } else {
        console.log('✅ Perfil criado manualmente!');
        console.log('📊 Dados do perfil:', profileData);
      }
    }
    
    // 5. Testar login final
    console.log('\n🔐 Testando login final...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      return false;
    } else {
      console.log('✅ Login funcionou perfeitamente!');
      console.log('👤 Usuário logado:', loginData.user.email);
      console.log('🔑 Session:', loginData.session ? 'Ativa' : 'Inativa');
      return true;
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    console.log('📋 Stack:', error.stack);
    return false;
  }
}

// Executar
createTestUser().then(success => {
  console.log('\n==================================================');
  if (success) {
    console.log('✅ USUÁRIO DE TESTE CRIADO E TESTADO COM SUCESSO!');
    console.log('🔑 Credenciais para teste no frontend:');
    console.log('   Email: test@example.com');
    console.log('   Senha: TestPassword123!');
    console.log('\n🌐 Agora você pode testar no frontend em:');
    console.log('   http://localhost:5173');
  } else {
    console.log('❌ FALHA AO CRIAR/TESTAR USUÁRIO');
  }
  console.log('==================================================');
  process.exit(success ? 0 : 1);
});