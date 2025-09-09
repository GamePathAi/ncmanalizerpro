import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuthFlow() {
  console.log('🔍 Debugando fluxo de autenticação...');
  console.log('URL:', supabaseUrl);
  console.log('Key (primeiros 20 chars):', supabaseKey.substring(0, 20) + '...');
  
  const testEmail = `debug${Date.now()}@exemplo.com`;
  const testPassword = 'senha123456';
  
  try {
    console.log('\n1. Testando conexão básica...');
    const { data: connectionTest, error: connectionError } = await supabase.auth.getSession();
    
    if (connectionError) {
      console.log('❌ Erro de conexão:', connectionError);
      return;
    }
    console.log('✅ Conexão estabelecida');
    
    console.log('\n2. Verificando se a tabela user_profiles existe...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Problema com tabela user_profiles:', tableError.message);
      console.log('Detalhes:', tableError);
    } else {
      console.log('✅ Tabela user_profiles acessível');
    }
    
    console.log('\n3. Tentando cadastro com mais detalhes...');
    console.log('Email de teste:', testEmail);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Debug'
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Erro detalhado no cadastro:');
      console.log('- Mensagem:', signUpError.message);
      console.log('- Código:', signUpError.status);
      console.log('- Tipo:', signUpError.name);
      console.log('- Detalhes completos:', JSON.stringify(signUpError, null, 2));
      
      // Verificar se é erro de RLS
      if (signUpError.message.includes('RLS') || signUpError.message.includes('policy')) {
        console.log('\n🔍 Possível problema de RLS detectado!');
      }
      
      // Verificar se é erro de trigger
      if (signUpError.message.includes('trigger') || signUpError.message.includes('function')) {
        console.log('\n🔍 Possível problema de trigger/função detectado!');
      }
      
    } else {
      console.log('✅ Cadastro realizado com sucesso!');
      console.log('Dados do usuário:', signUpData.user?.id);
      
      // Verificar se o perfil foi criado
      if (signUpData.user?.id) {
        console.log('\n4. Verificando se o perfil foi criado...');
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', signUpData.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Perfil não foi criado:', profileError.message);
        } else {
          console.log('✅ Perfil criado com sucesso:', profileData);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
  }
}

debugAuthFlow();