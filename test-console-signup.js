import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

// Cliente exatamente como no frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Teste de Console - Simulando Frontend');
console.log('==========================================');
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
console.log('');

// Função que simula exatamente o que o AuthForm.tsx faz
async function testFrontendSignup() {
  console.log('📋 SIMULANDO EXATAMENTE O QUE O FRONTEND FAZ:');
  console.log('============================================');
  
  // Dados de teste (como no formulário)
  const email = `test-console-${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  const fullName = 'Usuário Teste Console';
  
  console.log('📧 Email:', email);
  console.log('🔒 Password:', password.replace(/./g, '*'));
  console.log('👤 Full Name:', fullName);
  console.log('');
  
  try {
    console.log('🔄 Executando supabase.auth.signUp...');
    
    // Exatamente como no AuthForm.tsx e supabase.ts
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email
        }
      }
    });
    
    if (error) {
      console.log('❌ ERRO CAPTURADO:');
      console.log('- Mensagem:', error.message);
      console.log('- Status:', error.status);
      console.log('- Nome:', error.name);
      console.log('- Detalhes completos:', JSON.stringify(error, null, 2));
      
      // Analisar tipo específico de erro
      if (error.message.includes('Failed to fetch')) {
        console.log('\n🎯 DIAGNÓSTICO: "Failed to fetch"');
        console.log('Possíveis causas:');
        console.log('1. Problema de rede/conectividade');
        console.log('2. CORS bloqueando requisição');
        console.log('3. Supabase fora do ar');
        console.log('4. URL incorreta');
        console.log('5. Confirmação de email ainda habilitada');
      }
      
      if (error.message.includes('confirmation') || error.message.includes('email')) {
        console.log('\n🎯 DIAGNÓSTICO: Problema de email');
        console.log('Verifique se a confirmação de email foi desabilitada no Supabase');
      }
      
      return false;
    } else {
      console.log('✅ SIGNUP BEM-SUCEDIDO!');
      console.log('👤 Usuário criado:', data.user?.id);
      console.log('📧 Email:', data.user?.email);
      console.log('📧 Email confirmado:', data.user?.email_confirmed_at ? 'SIM' : 'NÃO');
      console.log('🔑 Sessão criada:', data.session ? 'SIM' : 'NÃO');
      
      if (data.session) {
        console.log('🔐 Access Token:', data.session.access_token ? 'PRESENTE' : 'AUSENTE');
        console.log('🔄 Refresh Token:', data.session.refresh_token ? 'PRESENTE' : 'AUSENTE');
      }
      
      return true;
    }
  } catch (fetchError) {
    console.log('💥 ERRO DE FETCH CAPTURADO:');
    console.log('- Mensagem:', fetchError.message);
    console.log('- Nome:', fetchError.name);
    console.log('- Stack:', fetchError.stack);
    
    console.log('\n🔍 ANÁLISE DO ERRO:');
    if (fetchError.message.includes('fetch')) {
      console.log('- Tipo: Erro de rede/conectividade');
      console.log('- Possível causa: CORS, proxy, ou Supabase indisponível');
    }
    
    return false;
  }
}

// Função para testar conectividade básica
async function testBasicConnectivity() {
  console.log('\n🌐 TESTE DE CONECTIVIDADE BÁSICA:');
  console.log('=================================');
  
  try {
    console.log('🔄 Testando getSession...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Erro na conectividade:', error.message);
      return false;
    } else {
      console.log('✅ Conectividade OK');
      console.log('📊 Sessão atual:', data.session ? 'Ativa' : 'Nenhuma');
      return true;
    }
  } catch (error) {
    console.log('❌ Erro de conectividade:', error.message);
    return false;
  }
}

// Função para testar configurações do Supabase
async function testSupabaseConfig() {
  console.log('\n⚙️  TESTE DE CONFIGURAÇÃO:');
  console.log('==========================');
  
  // Verificar se as URLs estão corretas
  console.log('🔗 URL válida:', supabaseUrl.startsWith('https://') ? 'SIM' : 'NÃO');
  console.log('🔑 Anon Key válida:', supabaseAnonKey.startsWith('eyJ') ? 'SIM' : 'NÃO');
  
  // Testar se consegue fazer uma requisição simples
  try {
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    console.log('🌐 Status da API:', response.status);
    console.log('🔄 API acessível:', response.status < 500 ? 'SIM' : 'NÃO');
    
    return response.status < 500;
  } catch (error) {
    console.log('❌ Erro ao acessar API:', error.message);
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  try {
    console.log('🚀 INICIANDO BATERIA DE TESTES...');
    console.log('=================================\n');
    
    // Teste 1: Configuração
    const configOk = await testSupabaseConfig();
    
    // Teste 2: Conectividade
    const connectivityOk = await testBasicConnectivity();
    
    // Teste 3: Signup (principal)
    const signupOk = await testFrontendSignup();
    
    // Resumo final
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('====================');
    console.log('⚙️  Configuração:', configOk ? '✅ OK' : '❌ FALHOU');
    console.log('🌐 Conectividade:', connectivityOk ? '✅ OK' : '❌ FALHOU');
    console.log('📝 Signup:', signupOk ? '✅ OK' : '❌ FALHOU');
    
    if (signupOk) {
      console.log('\n🎉 RESULTADO: SIGNUP FUNCIONANDO!');
      console.log('O problema pode estar no frontend/browser.');
      console.log('\n🔧 PRÓXIMOS PASSOS:');
      console.log('1. Limpar cache do browser (Ctrl+Shift+R)');
      console.log('2. Testar em aba anônima');
      console.log('3. Verificar console do browser para outros erros');
      console.log('4. Verificar se o Vite dev server está funcionando');
    } else {
      console.log('\n⚠️  RESULTADO: PROBLEMA IDENTIFICADO');
      console.log('O erro está no backend/configuração.');
      console.log('\n🔧 PRÓXIMOS PASSOS:');
      console.log('1. Verificar se confirmação de email foi desabilitada');
      console.log('2. Verificar configurações no Supabase Dashboard');
      console.log('3. Testar conectividade de rede');
      console.log('4. Verificar logs do Supabase');
    }
    
  } catch (error) {
    console.error('💥 Erro geral nos testes:', error.message);
  }
}

// Executar
runAllTests();