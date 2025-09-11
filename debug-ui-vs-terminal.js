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

console.log('🔍 Debug: Terminal vs UI - Identificando Diferenças');
console.log('==================================================');
console.log('🎯 Objetivo: Descobrir por que terminal funciona mas UI não');
console.log('');

// Cliente como no terminal (Node.js)
const supabaseTerminal = createClient(supabaseUrl, supabaseAnonKey);

// Simular cliente como no browser (com configurações diferentes)
const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }
});

async function testTerminalStyle() {
  console.log('🖥️  TESTE ESTILO TERMINAL (Node.js):');
  console.log('===================================');
  
  const email = `terminal-test-${Date.now()}@example.com`;
  console.log('📧 Email:', email);
  
  try {
    const { data, error } = await supabaseTerminal.auth.signUp({
      email: email,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Terminal User'
        }
      }
    });
    
    if (error) {
      console.log('❌ Terminal Error:', error.message);
      console.log('📊 Status:', error.status);
      return false;
    } else {
      console.log('✅ Terminal Success!');
      console.log('👤 User ID:', data.user?.id);
      console.log('📧 Email confirmed:', data.user?.email_confirmed_at ? 'YES' : 'NO');
      return true;
    }
  } catch (err) {
    console.log('💥 Terminal Exception:', err.message);
    return false;
  }
}

async function testBrowserStyle() {
  console.log('\n🌐 TESTE ESTILO BROWSER (Simulado):');
  console.log('===================================');
  
  const email = `browser-test-${Date.now()}@example.com`;
  console.log('📧 Email:', email);
  
  try {
    // Simular exatamente como o AuthForm.tsx faz
    const { data, error } = await supabaseBrowser.auth.signUp({
      email: email,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Browser User'
        }
      }
    });
    
    if (error) {
      console.log('❌ Browser Error:', error.message);
      console.log('📊 Status:', error.status);
      console.log('🔍 Error Type:', error.name);
      console.log('🔍 Error Code:', error.code);
      
      // Verificar se é erro específico do browser
      if (error.message.includes('Failed to fetch')) {
        console.log('🎯 DIAGNÓSTICO: Erro específico do browser!');
        console.log('Possíveis causas:');
        console.log('- CORS policy blocking');
        console.log('- Browser security restrictions');
        console.log('- Network proxy/firewall');
        console.log('- Browser extensions interfering');
      }
      
      return false;
    } else {
      console.log('✅ Browser Success!');
      console.log('👤 User ID:', data.user?.id);
      console.log('📧 Email confirmed:', data.user?.email_confirmed_at ? 'YES' : 'NO');
      return true;
    }
  } catch (err) {
    console.log('💥 Browser Exception:', err.message);
    console.log('🔍 Exception Type:', err.name);
    
    if (err.message.includes('fetch')) {
      console.log('🎯 DIAGNÓSTICO: Problema de fetch no browser!');
    }
    
    return false;
  }
}

async function analyzeEnvironmentDifferences() {
  console.log('\n🔬 ANÁLISE DAS DIFERENÇAS DE AMBIENTE:');
  console.log('=====================================');
  
  console.log('🖥️  Terminal (Node.js):');
  console.log('- Environment: Node.js');
  console.log('- Network: Direct HTTP requests');
  console.log('- CORS: Not applicable');
  console.log('- Security: Node.js security model');
  console.log('- Headers: Node.js default headers');
  
  console.log('\n🌐 Browser (UI):');
  console.log('- Environment: Browser/Vite dev server');
  console.log('- Network: Browser fetch API');
  console.log('- CORS: Browser CORS policy');
  console.log('- Security: Browser security model');
  console.log('- Headers: Browser default headers');
  console.log('- Dev Server: Vite proxy/hot reload');
  
  console.log('\n🔍 POSSÍVEIS CAUSAS DA DIFERENÇA:');
  console.log('1. 🚫 CORS Policy - Browser blocking cross-origin requests');
  console.log('2. 🔒 Browser Security - Stricter security in browser environment');
  console.log('3. 🌐 Network Proxy - Corporate/ISP proxy affecting browser');
  console.log('4. 🔧 Vite Dev Server - Development server configuration issues');
  console.log('5. 🧩 Browser Extensions - Ad blockers or security extensions');
  console.log('6. 📱 User Agent - Different headers between Node.js and browser');
  console.log('7. 🍪 Session Handling - Browser session/cookie management');
}

async function testNetworkConnectivity() {
  console.log('\n🌐 TESTE DE CONECTIVIDADE DE REDE:');
  console.log('==================================');
  
  try {
    // Testar acesso direto à API do Supabase
    console.log('🔄 Testando acesso direto à API...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status da API:', response.status);
    console.log('✅ API acessível:', response.status < 500 ? 'SIM' : 'NÃO');
    
    // Testar endpoint de auth específico
    console.log('\n🔄 Testando endpoint de auth...');
    
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: `connectivity-test-${Date.now()}@example.com`,
        password: 'TestPassword123!'
      })
    });
    
    console.log('📊 Status do Auth:', authResponse.status);
    
    if (authResponse.status === 500) {
      const errorText = await authResponse.text();
      console.log('❌ Erro 500:', errorText);
      
      if (errorText.includes('confirmation email')) {
        console.log('🎯 CONFIRMADO: Problema de confirmação de email!');
        return 'email_confirmation_issue';
      }
    }
    
    return 'network_ok';
    
  } catch (error) {
    console.log('❌ Erro de conectividade:', error.message);
    return 'network_error';
  }
}

async function provideSolutions(terminalWorks, browserWorks, networkStatus) {
  console.log('\n🎯 SOLUÇÕES BASEADAS NO DIAGNÓSTICO:');
  console.log('====================================');
  
  if (terminalWorks && !browserWorks) {
    console.log('\n🔍 CENÁRIO: Terminal funciona, Browser não');
    console.log('\n✅ SOLUÇÕES PARA O BROWSER:');
    console.log('\n1. 🧹 LIMPAR CACHE COMPLETO:');
    console.log('   - Pressione Ctrl+Shift+Delete');
    console.log('   - Selecione "Todo o período"');
    console.log('   - Marque todas as opções');
    console.log('   - Clique em "Limpar dados"');
    
    console.log('\n2. 🕵️ TESTAR EM MODO ANÔNIMO:');
    console.log('   - Abra aba anônima/incógnita');
    console.log('   - Acesse http://localhost:5173');
    console.log('   - Teste o signup');
    
    console.log('\n3. 🚫 DESABILITAR EXTENSÕES:');
    console.log('   - Desabilite ad blockers');
    console.log('   - Desabilite extensões de segurança');
    console.log('   - Teste novamente');
    
    console.log('\n4. 🌐 TESTAR OUTRO BROWSER:');
    console.log('   - Chrome, Firefox, Edge');
    console.log('   - Verificar se problema persiste');
    
    console.log('\n5. 🔧 VERIFICAR VITE DEV SERVER:');
    console.log('   - Reiniciar: npm run dev');
    console.log('   - Verificar console do Vite');
    console.log('   - Testar em http://localhost:5173');
    
  } else if (!terminalWorks && !browserWorks) {
    console.log('\n🔍 CENÁRIO: Nem terminal nem browser funcionam');
    console.log('\n✅ PROBLEMA NO BACKEND - SOLUÇÕES:');
    console.log('1. Desabilitar confirmação de email no Supabase');
    console.log('2. Verificar configurações de autenticação');
    console.log('3. Aguardar propagação das mudanças (5-10 min)');
    
  } else if (terminalWorks && browserWorks) {
    console.log('\n🎉 AMBOS FUNCIONAM!');
    console.log('O problema pode ter sido resolvido ou é intermitente.');
    console.log('\n🔧 VERIFICAÇÕES ADICIONAIS:');
    console.log('1. Testar no frontend real (http://localhost:5173)');
    console.log('2. Verificar console do browser para outros erros');
    console.log('3. Testar com diferentes emails');
  }
  
  if (networkStatus === 'email_confirmation_issue') {
    console.log('\n🚨 PROBLEMA CRÍTICO IDENTIFICADO:');
    console.log('A confirmação de email AINDA está habilitada!');
    console.log('\n📝 AÇÃO URGENTE:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/auth/settings');
    console.log('2. Desmarque "Enable email confirmations"');
    console.log('3. Salve as alterações');
    console.log('4. Aguarde 5 minutos');
    console.log('5. Execute: node verify-supabase-settings.js');
  }
}

// Executar diagnóstico completo
async function runCompleteDebug() {
  try {
    console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO...');
    console.log('===================================\n');
    
    // Teste 1: Terminal
    const terminalWorks = await testTerminalStyle();
    
    // Teste 2: Browser simulado
    const browserWorks = await testBrowserStyle();
    
    // Teste 3: Conectividade
    const networkStatus = await testNetworkConnectivity();
    
    // Análise das diferenças
    await analyzeEnvironmentDifferences();
    
    // Soluções específicas
    await provideSolutions(terminalWorks, browserWorks, networkStatus);
    
    console.log('\n📊 RESUMO FINAL:');
    console.log('================');
    console.log('🖥️  Terminal:', terminalWorks ? '✅ FUNCIONA' : '❌ FALHA');
    console.log('🌐 Browser:', browserWorks ? '✅ FUNCIONA' : '❌ FALHA');
    console.log('🌐 Network:', networkStatus);
    
    if (terminalWorks && !browserWorks) {
      console.log('\n🎯 CONCLUSÃO: PROBLEMA ESPECÍFICO DO BROWSER/UI');
      console.log('Siga as soluções para browser listadas acima.');
    } else if (!terminalWorks) {
      console.log('\n🎯 CONCLUSÃO: PROBLEMA NO BACKEND');
      console.log('Confirmação de email ainda habilitada.');
    } else {
      console.log('\n🎯 CONCLUSÃO: SISTEMA FUNCIONANDO');
      console.log('Teste no frontend para confirmar.');
    }
    
  } catch (error) {
    console.error('💥 Erro no diagnóstico:', error.message);
  }
}

// Executar
runCompleteDebug();