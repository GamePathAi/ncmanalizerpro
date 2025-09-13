const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase Local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLocalSupabase() {
  console.log('🔍 Testando conexão com Supabase Local...');
  
  try {
    // Teste 1: Verificar se conseguimos conectar
    console.log('\n1. Testando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Erro na conexão:', healthError.message);
      return;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Teste 2: Verificar estrutura da tabela user_profiles
    console.log('\n2. Verificando tabela user_profiles...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      console.log('📝 Detalhes do erro:', usersError);
    } else {
      console.log('✅ Tabela user_profiles encontrada!');
      console.log(`📊 Usuários encontrados: ${users.length}`);
      
      if (users.length > 0) {
        console.log('\n👤 Primeiro usuário:');
        console.log(JSON.stringify(users[0], null, 2));
      }
    }
    
    // Teste 3: Verificar se conseguimos criar um usuário de teste
    console.log('\n3. Testando criação de usuário...');
    const testUser = {
      email: 'teste@local.com',
      subscription_status: 'pending_email',
      created_at: new Date().toISOString()
    };
    
    const { data: newUser, error: createError } = await supabase
      .from('user_profiles')
      .insert([testUser])
      .select();
    
    if (createError) {
      console.log('❌ Erro ao criar usuário:', createError.message);
      console.log('📝 Detalhes do erro:', createError);
    } else {
      console.log('✅ Usuário de teste criado com sucesso!');
      console.log('👤 Novo usuário:', JSON.stringify(newUser[0], null, 2));
      
      // Limpar usuário de teste
      await supabase
        .from('user_profiles')
        .delete()
        .eq('email', 'teste@local.com');
      console.log('🧹 Usuário de teste removido.');
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    console.log('📝 Stack trace:', error.stack);
  }
}

// Executar teste
testLocalSupabase()
  .then(() => {
    console.log('\n🎉 Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.log('💥 Erro fatal:', error);
    process.exit(1);
  });