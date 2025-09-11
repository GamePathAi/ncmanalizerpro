// Teste específico para problemas de CORS e configuração do frontend
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis do .env
dotenv.config();

async function testFrontendCORS() {
  console.log('🧪 Testando problemas de CORS e configuração...');
  console.log('');
  
  // Testar configuração básica
  console.log('📋 CONFIGURAÇÃO:');
  console.log('URL Supabase:', process.env.VITE_SUPABASE_URL);
  console.log('Chave anônima:', process.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
  console.log('');
  
  // Criar cliente Supabase
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  
  try {
    // Teste 1: Verificar conectividade básica
    console.log('🔍 TESTE 1: Conectividade básica');
    const { data: healthCheck, error: healthError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Erro na conectividade:', healthError.message);
      return false;
    } else {
      console.log('✅ Conectividade OK');
    }
    
    // Teste 2: Testar signup simples
    console.log('');
    console.log('🔍 TESTE 2: Signup simples');
    const testEmail = `cors-test-${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    console.log('📧 Testando com:', testEmail);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Teste CORS'
        }
      }
    });
    
    if (signupError) {
      console.log('❌ Erro no signup:', signupError.message);
      console.log('🔍 Código:', signupError.status);
      console.log('🔍 Detalhes:', signupError);
      
      // Verificar se é erro de CORS
      if (signupError.message.includes('fetch') || 
          signupError.message.includes('CORS') ||
          signupError.message.includes('network')) {
        console.log('🚨 POSSÍVEL PROBLEMA DE CORS DETECTADO!');
        return false;
      }
    } else {
      console.log('✅ Signup realizado com sucesso!');
      console.log('👤 Usuário:', signupData.user?.id);
    }
    
    // Teste 3: Verificar configuração de auth no Supabase
    console.log('');
    console.log('🔍 TESTE 3: Configuração de autenticação');
    
    // Tentar fazer logout para testar outras funções de auth
    const { error: signoutError } = await supabase.auth.signOut();
    
    if (signoutError) {
      console.log('⚠️ Erro no signout:', signoutError.message);
    } else {
      console.log('✅ Signout funcionando');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message);
    
    // Verificar se é erro de rede/CORS
    if (error.message.includes('fetch') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('CORS') ||
        error.message.includes('network')) {
      console.log('');
      console.log('🚨 PROBLEMA DE CORS/REDE DETECTADO!');
      console.log('');
      console.log('🔧 SOLUÇÕES POSSÍVEIS:');
      console.log('1. Verificar se o domínio está configurado no Supabase');
      console.log('2. Verificar configurações de CORS no dashboard do Supabase');
      console.log('3. Verificar se as variáveis de ambiente estão corretas');
      console.log('4. Tentar acessar a aplicação via localhost:5173');
      console.log('');
      console.log('🌐 Dashboard Supabase: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm');
    }
    
    return false;
  }
}

// Executar teste
testFrontendCORS().then(success => {
  console.log('');
  if (success) {
    console.log('🎯 RESULTADO: Configuração parece estar correta!');
    console.log('💡 O problema pode estar no frontend React.');
  } else {
    console.log('💥 RESULTADO: Problema identificado na configuração!');
  }
  
  console.log('');
  console.log('🔧 PRÓXIMOS PASSOS:');
  console.log('1. Verificar console do navegador para erros específicos');
  console.log('2. Testar signup diretamente no navegador');
  console.log('3. Verificar se o servidor dev está rodando corretamente');
}).catch(err => {
  console.log('💥 Erro fatal no teste:', err.message);
});