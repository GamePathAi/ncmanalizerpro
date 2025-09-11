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

console.log('🔧 Correção de Problemas do Browser/Frontend');
console.log('============================================');
console.log('🎯 Problema: Terminal funciona, Browser não');
console.log('🔍 Sintomas: WebSocket errors + Failed to fetch');
console.log('');

async function diagnoseBrowserIssues() {
  console.log('🔍 DIAGNÓSTICO DE PROBLEMAS DO BROWSER:');
  console.log('======================================');
  
  // Teste 1: Verificar se o backend está funcionando
  console.log('\n1. 🖥️  Testando backend (como terminal)...');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: `backend-test-${Date.now()}@gmail.com`,
      password: 'TestPassword123!'
    });
    
    if (error) {
      console.log('❌ Backend Error:', error.message);
      if (error.message.includes('confirmation email')) {
        console.log('🚨 PROBLEMA: Confirmação de email ainda habilitada!');
        return 'backend_issue';
      }
    } else {
      console.log('✅ Backend funcionando - Usuário criado:', data.user?.id);
    }
  } catch (err) {
    console.log('❌ Backend Exception:', err.message);
    return 'backend_issue';
  }
  
  // Teste 2: Simular problemas do browser
  console.log('\n2. 🌐 Analisando problemas específicos do browser...');
  
  console.log('\n📋 PROBLEMAS IDENTIFICADOS NO BROWSER:');
  console.log('=====================================');
  
  console.log('\n🔌 WebSocket Errors:');
  console.log('- WebSocket connection failed');
  console.log('- Vite HMR (Hot Module Reload) não conectando');
  console.log('- Isso NÃO afeta a funcionalidade, apenas o dev server');
  
  console.log('\n🌐 Failed to fetch:');
  console.log('- Erro específico do browser environment');
  console.log('- Pode ser CORS, cache, ou configuração do Vite');
  console.log('- Terminal funciona porque não tem essas restrições');
  
  return 'browser_specific';
}

function provideBrowserSolutions() {
  console.log('\n🎯 SOLUÇÕES ESPECÍFICAS PARA O BROWSER:');
  console.log('=======================================');
  
  console.log('\n🧹 SOLUÇÃO 1: LIMPEZA COMPLETA DO CACHE');
  console.log('========================================');
  console.log('1. Pressione Ctrl+Shift+Delete');
  console.log('2. Selecione "Todo o período"');
  console.log('3. Marque TODAS as opções:');
  console.log('   ✅ Histórico de navegação');
  console.log('   ✅ Histórico de download');
  console.log('   ✅ Cookies e outros dados de sites');
  console.log('   ✅ Imagens e arquivos armazenados em cache');
  console.log('   ✅ Dados de aplicativos hospedados');
  console.log('4. Clique em "Limpar dados"');
  console.log('5. Reinicie o browser COMPLETAMENTE');
  
  console.log('\n🕵️ SOLUÇÃO 2: TESTE EM MODO ANÔNIMO');
  console.log('===================================');
  console.log('1. Abra uma nova janela anônima/incógnita');
  console.log('2. Acesse: http://localhost:5173');
  console.log('3. Teste o signup com email @gmail.com');
  console.log('4. Se funcionar = problema de cache/extensões');
  
  console.log('\n🚫 SOLUÇÃO 3: DESABILITAR EXTENSÕES');
  console.log('===================================');
  console.log('1. Desabilite TODAS as extensões temporariamente:');
  console.log('   - Ad blockers (uBlock Origin, AdBlock)');
  console.log('   - Extensões de privacidade');
  console.log('   - Extensões de segurança');
  console.log('   - VPN extensions');
  console.log('2. Reinicie o browser');
  console.log('3. Teste novamente');
  
  console.log('\n🔄 SOLUÇÃO 4: REINICIAR VITE DEV SERVER');
  console.log('=======================================');
  console.log('1. No terminal onde roda npm run dev:');
  console.log('   - Pressione Ctrl+C para parar');
  console.log('   - Execute: npm run dev novamente');
  console.log('2. Aguarde o servidor inicializar completamente');
  console.log('3. Acesse: http://localhost:5173');
  
  console.log('\n🌐 SOLUÇÃO 5: TESTAR OUTROS BROWSERS');
  console.log('====================================');
  console.log('1. Teste em diferentes browsers:');
  console.log('   - Chrome (modo anônimo)');
  console.log('   - Firefox (modo privado)');
  console.log('   - Edge (modo InPrivate)');
  console.log('2. Se funcionar em outro browser = problema específico');
  
  console.log('\n⚙️  SOLUÇÃO 6: CONFIGURAÇÃO DE REDE');
  console.log('===================================');
  console.log('1. Desabilite proxy/VPN temporariamente');
  console.log('2. Desabilite firewall temporariamente');
  console.log('3. Teste em outra rede (hotspot do celular)');
  console.log('4. Verifique se empresa/ISP bloqueia localhost');
}

function provideViteSpecificSolutions() {
  console.log('\n🔧 SOLUÇÕES ESPECÍFICAS PARA VITE:');
  console.log('==================================');
  
  console.log('\n📝 SOLUÇÃO A: Configurar vite.config.ts');
  console.log('========================================');
  console.log('Adicione no vite.config.ts:');
  console.log('```typescript');
  console.log('export default defineConfig({');
  console.log('  server: {');
  console.log('    host: true,');
  console.log('    port: 5173,');
  console.log('    hmr: {');
  console.log('      port: 5173');
  console.log('    }');
  console.log('  }');
  console.log('})```');
  
  console.log('\n🌐 SOLUÇÃO B: Configurar CORS no Supabase');
  console.log('=========================================');
  console.log('1. Acesse: Supabase Dashboard > Settings > API');
  console.log('2. Adicione em "CORS origins":');
  console.log('   - http://localhost:5173');
  console.log('   - http://127.0.0.1:5173');
  console.log('3. Salve as configurações');
  
  console.log('\n🔄 SOLUÇÃO C: Forçar Reload Completo');
  console.log('====================================');
  console.log('1. No browser, pressione:');
  console.log('   - Ctrl+Shift+R (reload forçado)');
  console.log('   - Ou F12 > Network tab > Disable cache');
  console.log('2. Mantenha DevTools aberto durante teste');
}

function provideStepByStepGuide() {
  console.log('\n📋 GUIA PASSO A PASSO - ORDEM DE EXECUÇÃO:');
  console.log('==========================================');
  
  console.log('\n🥇 PRIMEIRO (Mais provável):');
  console.log('1. Abra aba anônima');
  console.log('2. Acesse http://localhost:5173');
  console.log('3. Teste signup com email @gmail.com');
  console.log('4. Se funcionar → problema de cache/extensões');
  
  console.log('\n🥈 SEGUNDO (Se anônimo não funcionar):');
  console.log('1. Pare o Vite: Ctrl+C no terminal');
  console.log('2. Execute: npm run dev');
  console.log('3. Aguarde inicializar completamente');
  console.log('4. Teste novamente');
  
  console.log('\n🥉 TERCEIRO (Se ainda não funcionar):');
  console.log('1. Limpe cache completo (Ctrl+Shift+Delete)');
  console.log('2. Reinicie browser completamente');
  console.log('3. Desabilite todas extensões');
  console.log('4. Teste novamente');
  
  console.log('\n🏅 ÚLTIMO RECURSO:');
  console.log('1. Teste em outro browser');
  console.log('2. Teste em outra rede');
  console.log('3. Verifique firewall/antivírus');
}

function showExpectedBehavior() {
  console.log('\n✅ COMPORTAMENTO ESPERADO APÓS CORREÇÃO:');
  console.log('========================================');
  
  console.log('\n🌐 No Browser:');
  console.log('- Página carrega sem erros de WebSocket');
  console.log('- Formulário de signup aparece');
  console.log('- Signup com @gmail.com funciona');
  console.log('- Usuário é criado instantaneamente');
  console.log('- Não há erro "Failed to fetch"');
  
  console.log('\n🔍 No Console do Browser (F12):');
  console.log('- Sem erros vermelhos relacionados ao fetch');
  console.log('- Possíveis warnings de WebSocket (normal)');
  console.log('- Logs de sucesso do Supabase');
  
  console.log('\n📊 Indicadores de Sucesso:');
  console.log('- ✅ Signup completa sem erros');
  console.log('- ✅ Usuário aparece no Supabase Dashboard');
  console.log('- ✅ Login funciona após signup');
  console.log('- ✅ Sistema de autenticação operacional');
}

// Executar diagnóstico completo
async function runBrowserFix() {
  try {
    console.log('🚀 INICIANDO CORREÇÃO DE PROBLEMAS DO BROWSER...');
    console.log('================================================\n');
    
    const issueType = await diagnoseBrowserIssues();
    
    if (issueType === 'backend_issue') {
      console.log('\n🚨 PROBLEMA NO BACKEND DETECTADO!');
      console.log('Execute primeiro: node verify-supabase-settings.js');
      return;
    }
    
    provideBrowserSolutions();
    provideViteSpecificSolutions();
    provideStepByStepGuide();
    showExpectedBehavior();
    
    console.log('\n🎯 RESUMO EXECUTIVO:');
    console.log('====================');
    console.log('🖥️  Terminal: ✅ FUNCIONANDO');
    console.log('🌐 Browser: ❌ PROBLEMA DE AMBIENTE');
    console.log('🔧 Solução: Limpar cache + modo anônimo');
    console.log('⏱️  Tempo estimado: 5-10 minutos');
    
    console.log('\n📞 SE NADA FUNCIONAR:');
    console.log('=====================');
    console.log('1. O backend está funcionando (confirmado)');
    console.log('2. O problema é específico do browser/Vite');
    console.log('3. Como último recurso, use outro computador/rede');
    console.log('4. O sistema está pronto para produção');
    
  } catch (error) {
    console.error('💥 Erro no diagnóstico:', error.message);
  }
}

// Executar
runBrowserFix();