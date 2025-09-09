/**
 * Script de teste para validar o email hook do Supabase
 * Execute: node test-email-hook.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fsntzljufghutoyqxokm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não encontrada no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailHook() {
  console.log('🧪 Iniciando teste do email hook...');
  console.log('📧 URL do Supabase:', supabaseUrl);
  
  try {
    // 1. Testar conexão com Supabase
    console.log('\n1️⃣ Testando conexão com Supabase...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError.message);
      return;
    }
    console.log('✅ Conexão com Supabase OK');

    // 2. Testar Edge Function diretamente
    console.log('\n2️⃣ Testando Edge Function diretamente...');
    const testEmail = `teste-${Date.now()}@exemplo.com`;
    const testName = 'Usuário Teste';
    
    const { data: functionData, error: functionError } = await supabase.functions
      .invoke('send-welcome-email', {
        body: {
          email: testEmail,
          name: testName
        }
      });
    
    if (functionError) {
      console.error('❌ Erro na Edge Function:', functionError.message);
      console.log('💡 Verifique se a função foi deployada: supabase functions deploy send-welcome-email');
    } else {
      console.log('✅ Edge Function executada com sucesso');
      console.log('📧 Resposta:', functionData);
    }

    // 3. Testar registro de usuário (simulação)
    console.log('\n3️⃣ Simulando registro de usuário...');
    const randomEmail = `teste-${Date.now()}@exemplo.com`;
    const randomPassword = 'TestPassword123!';
    const randomName = 'Usuário Teste Automático';
    
    console.log('📝 Tentando registrar usuário:', randomEmail);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: randomEmail,
      password: randomPassword,
      options: {
        data: {
          full_name: randomName
        }
      }
    });
    
    if (signUpError) {
      console.error('❌ Erro no registro:', signUpError.message);
      
      // Se o erro for de email já existente, isso é esperado em testes
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️  Email já registrado (esperado em testes)');
      }
    } else {
      console.log('✅ Usuário registrado com sucesso');
      console.log('👤 ID do usuário:', signUpData.user?.id);
      console.log('📧 Email confirmado:', signUpData.user?.email_confirmed_at ? 'Sim' : 'Não');
      
      // Aguardar um pouco para o trigger executar
      console.log('⏳ Aguardando execução do trigger...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se o perfil foi criado
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError.message);
      } else {
        console.log('✅ Perfil criado automaticamente');
        console.log('👤 Dados do perfil:', {
          email: profileData.email,
          full_name: profileData.full_name,
          created_at: profileData.created_at
        });
      }
    }

    // 4. Verificar logs (se possível)
    console.log('\n4️⃣ Verificações finais...');
    console.log('📊 Para ver logs da Edge Function, execute:');
    console.log('   supabase functions logs send-welcome-email');
    console.log('\n🎯 Para testar manualmente:');
    console.log('   1. Registre um usuário no seu app');
    console.log('   2. Verifique os logs no dashboard do Supabase');
    console.log('   3. Confirme se o email foi enviado');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verifique se o .env está configurado corretamente');
    console.log('   2. Confirme se o schema do banco foi aplicado');
    console.log('   3. Verifique se a Edge Function foi deployada');
    console.log('   4. Confirme as variáveis de ambiente no Supabase');
  }
}

// Executar teste
testEmailHook().then(() => {
  console.log('\n🏁 Teste concluído!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});