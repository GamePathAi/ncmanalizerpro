import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTriggers() {
  console.log('🔍 Verificando status dos triggers...');
  
  try {
    // 1. Verificar se a tabela user_profiles existe e está acessível
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (profileError) {
      console.log('❌ Erro ao acessar user_profiles:', profileError.message);
    } else {
      console.log('✅ Tabela user_profiles acessível');
    }
    
    // 2. Verificar quantos perfis existem
    const { data: profileCount, error: countError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (countError) {
      console.log('❌ Erro ao contar perfis:', countError.message);
    } else {
      console.log(`📊 Total de perfis existentes: ${profileCount?.length || 0}`);
      if (profileCount && profileCount.length > 0) {
        console.log('👥 Perfis encontrados:');
        profileCount.forEach(profile => {
          console.log(`  - ${profile.email} (${profile.full_name}) - Status: ${profile.subscription_status}`);
        });
      }
    }
    
    // 3. Tentar um signup simples
    console.log('\n🧪 Testando signup...');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test123456',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
    
    if (signupError) {
      console.log('❌ Erro no signup:', signupError.message);
      console.log('📝 Detalhes do erro:', JSON.stringify(signupError, null, 2));
    } else {
      console.log('✅ Signup realizado com sucesso');
      console.log('👤 Usuário criado:', signupData.user?.id);
      
      // Verificar se foi inserido na user_profiles
      if (signupData.user?.id) {
        // Aguardar um pouco para o trigger executar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: profile, error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();
        
        if (profileCheckError) {
          console.log('❌ Perfil não foi criado:', profileCheckError.message);
        } else {
          console.log('✅ Perfil criado com sucesso:', profile);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

verifyTriggers();