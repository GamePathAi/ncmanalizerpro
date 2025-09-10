import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyDatabase() {
  console.log('🔍 Verificando estrutura da tabela user_profiles...');
  
  try {
    // Tentar fazer uma query simples na tabela user_profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('❌ Erro ao acessar user_profiles:', profileError);
    } else {
      console.log('✅ Tabela user_profiles acessível');
      console.log('📊 Estrutura encontrada:', profiles);
    }
    
    // Tentar criar um usuário de teste para ver se o trigger funciona
    console.log('\n🧪 Testando criação de usuário...');
    const testEmail = `teste-trigger-${Date.now()}@exemplo.com`;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'senha123456',
      options: {
        data: {
          full_name: 'Teste Trigger'
        }
      }
    });
    
    if (authError) {
      console.log('❌ Erro na criação do usuário:', authError);
    } else {
      console.log('✅ Usuário criado com sucesso');
      console.log('👤 ID do usuário:', authData.user?.id);
      
      // Aguardar um pouco e verificar se o perfil foi criado
      setTimeout(async () => {
        const { data: newProfile, error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user?.id)
          .single();
        
        if (profileCheckError) {
          console.log('❌ Perfil não foi criado automaticamente:', profileCheckError);
        } else {
          console.log('✅ Perfil criado automaticamente pelo trigger!');
          console.log('📋 Dados do perfil:', newProfile);
        }
      }, 2000);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verifyDatabase();