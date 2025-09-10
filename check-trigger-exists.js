import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTriggerDirectly() {
  console.log('🔍 Testando se o trigger funciona diretamente...');
  
  const testEmail = `trigger-test-${Date.now()}@example.com`;
  const testUserId = crypto.randomUUID();
  
  try {
    console.log('1. Verificando registros antes do teste...');
    const { data: beforeCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' });
    
    console.log(`📊 Registros antes: ${beforeCount?.length || 0}`);
    
    console.log('2. Tentando inserir diretamente na tabela auth.users (simulando trigger)...');
    
    // Como não temos acesso direto à tabela auth.users, vamos tentar um cadastro real
    console.log('3. Testando cadastro real via Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Teste Trigger Direto'
        }
      }
    });
    
    if (authError) {
      console.log('❌ Erro no cadastro:', authError.message);
      console.log('📋 Detalhes:', authError);
      return;
    }
    
    console.log('✅ Usuário criado no auth:', authData.user?.id);
    
    // Aguardar um pouco para o trigger executar
    console.log('⏳ Aguardando trigger executar...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('4. Verificando se o perfil foi criado...');
    const { data: afterData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', testEmail);
    
    if (afterData && afterData.length > 0) {
      console.log('✅ Trigger funcionou! Perfil criado:', afterData[0]);
      
      // Limpar teste
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', afterData[0].id);
      
      console.log('🧹 Registro de teste removido');
    } else {
      console.log('❌ Trigger NÃO funcionou - perfil não foi criado automaticamente');
      
      // Verificar se pelo menos conseguimos acessar a tabela
      const { data: allProfiles, error: selectError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' });
      
      if (selectError) {
        console.log('❌ Erro ao acessar user_profiles:', selectError.message);
      } else {
        console.log(`📊 Total de perfis na tabela: ${allProfiles?.length || 0}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testTriggerDirectly();