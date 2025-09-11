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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Verificação das Configurações do Supabase');
console.log('=============================================');
console.log('🔗 Projeto:', supabaseUrl.split('//')[1].split('.')[0]);
console.log('');

async function checkAuthSettings() {
  console.log('📋 VERIFICANDO CONFIGURAÇÕES DE AUTENTICAÇÃO:');
  console.log('============================================');
  
  try {
    // Tentar fazer signup com email temporário para ver o comportamento
    const testEmail = `settings-test-${Date.now()}@temp.com`;
    console.log('🧪 Testando com email temporário:', testEmail);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TempPassword123!'
    });
    
    if (error) {
      console.log('❌ Erro encontrado:', error.message);
      console.log('📊 Status:', error.status);
      console.log('🔍 Código:', error.code);
      
      // Analisar o tipo de erro para determinar as configurações
      if (error.message.includes('Error sending confirmation email')) {
        console.log('\n🎯 DIAGNÓSTICO:');
        console.log('❌ Confirmação de email AINDA ESTÁ HABILITADA');
        console.log('\n📝 AÇÃO NECESSÁRIA:');
        console.log('1. Acesse: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0]);
        console.log('2. Vá para Authentication > Settings');
        console.log('3. Procure por "Enable email confirmations"');
        console.log('4. DESMARQUE esta opção');
        console.log('5. Clique em "Save" ou "Update"');
        console.log('6. Aguarde 2-3 minutos para aplicar');
        console.log('\n⚠️  IMPORTANTE: Certifique-se de que a configuração foi SALVA!');
        return 'email_confirmation_enabled';
      }
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n🎯 DIAGNÓSTICO:');
        console.log('✅ Confirmação de email está DESABILITADA');
        console.log('❌ Mas há outro problema (credenciais)');
        return 'other_auth_issue';
      }
      
      if (error.message.includes('User already registered')) {
        console.log('\n🎯 DIAGNÓSTICO:');
        console.log('✅ Confirmação de email está DESABILITADA');
        console.log('✅ Sistema de signup funcionando (usuário já existe)');
        return 'working';
      }
      
      return 'unknown_error';
    } else {
      console.log('✅ Signup bem-sucedido!');
      console.log('👤 Usuário criado:', data.user?.id);
      console.log('📧 Email confirmado automaticamente:', data.user?.email_confirmed_at ? 'SIM' : 'NÃO');
      
      if (data.user?.email_confirmed_at) {
        console.log('\n🎯 DIAGNÓSTICO:');
        console.log('✅ Confirmação de email está DESABILITADA');
        console.log('✅ Sistema funcionando perfeitamente!');
        return 'working_perfectly';
      } else {
        console.log('\n🎯 DIAGNÓSTICO:');
        console.log('⚠️  Confirmação de email pode estar habilitada');
        console.log('⚠️  Ou há configuração mista');
        return 'mixed_configuration';
      }
    }
  } catch (error) {
    console.log('💥 Erro inesperado:', error.message);
    return 'network_error';
  }
}

async function testWithDifferentEmails() {
  console.log('\n🧪 TESTANDO COM DIFERENTES TIPOS DE EMAIL:');
  console.log('==========================================');
  
  const testEmails = [
    `test1-${Date.now()}@gmail.com`,
    `test2-${Date.now()}@outlook.com`,
    `test3-${Date.now()}@yahoo.com`,
    `test4-${Date.now()}@example.com`
  ];
  
  for (const email of testEmails) {
    console.log(`\n📧 Testando: ${email}`);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'TestPassword123!'
      });
      
      if (error) {
        console.log(`❌ ${error.message}`);
        if (error.message.includes('Error sending confirmation email')) {
          console.log('   → Confirmação de email HABILITADA');
          return false; // Para no primeiro erro de confirmação
        }
      } else {
        console.log(`✅ Sucesso - Email confirmado: ${data.user?.email_confirmed_at ? 'SIM' : 'NÃO'}`);
      }
    } catch (err) {
      console.log(`💥 Erro: ${err.message}`);
    }
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return true;
}

async function provideFinalSolution(diagnosisResult) {
  console.log('\n🎯 SOLUÇÃO FINAL BASEADA NO DIAGNÓSTICO:');
  console.log('========================================');
  
  switch (diagnosisResult) {
    case 'email_confirmation_enabled':
      console.log('\n🚨 PROBLEMA CONFIRMADO: Email confirmation ainda habilitado');
      console.log('\n✅ SOLUÇÃO DEFINITIVA:');
      console.log('1. Abra uma nova aba no navegador');
      console.log('2. Acesse: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/auth/settings');
      console.log('3. Faça login na sua conta Supabase');
      console.log('4. Procure a seção "User Signups"');
      console.log('5. Encontre "Enable email confirmations"');
      console.log('6. DESMARQUE esta opção (deve ficar DESMARCADA)');
      console.log('7. Clique em "Save" ou "Update"');
      console.log('8. Aguarde 3-5 minutos');
      console.log('9. Execute este script novamente: node verify-supabase-settings.js');
      console.log('\n⚠️  CRÍTICO: Se não conseguir acessar, peça ajuda para desabilitar!');
      break;
      
    case 'working_perfectly':
      console.log('\n🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!');
      console.log('O problema deve estar no frontend/browser.');
      console.log('\n🔧 SOLUÇÕES PARA O FRONTEND:');
      console.log('1. Limpar cache completo do browser (Ctrl+Shift+Delete)');
      console.log('2. Testar em aba anônima/incógnita');
      console.log('3. Desabilitar extensões do browser');
      console.log('4. Verificar se há proxy/VPN interferindo');
      console.log('5. Testar em outro browser');
      break;
      
    case 'network_error':
      console.log('\n🌐 PROBLEMA DE REDE DETECTADO');
      console.log('\n🔧 SOLUÇÕES:');
      console.log('1. Verificar conexão com internet');
      console.log('2. Desabilitar proxy/VPN temporariamente');
      console.log('3. Verificar firewall');
      console.log('4. Testar em outra rede');
      break;
      
    default:
      console.log('\n❓ DIAGNÓSTICO INCONCLUSIVO');
      console.log('\n🔧 SOLUÇÕES GERAIS:');
      console.log('1. Desabilitar confirmação de email (principal)');
      console.log('2. Aguardar alguns minutos após mudanças');
      console.log('3. Limpar cache do browser');
      console.log('4. Testar em ambiente diferente');
  }
}

// Executar verificação completa
async function runVerification() {
  try {
    const diagnosis = await checkAuthSettings();
    
    if (diagnosis === 'email_confirmation_enabled') {
      // Se confirmação ainda está habilitada, não precisa testar mais
      await provideFinalSolution(diagnosis);
    } else {
      // Se não está claro, testar com diferentes emails
      const allTestsPassed = await testWithDifferentEmails();
      
      if (allTestsPassed) {
        await provideFinalSolution('working_perfectly');
      } else {
        await provideFinalSolution('email_confirmation_enabled');
      }
    }
    
    console.log('\n📞 SUPORTE ADICIONAL:');
    console.log('=====================');
    console.log('Se o problema persistir após seguir as soluções:');
    console.log('1. Aguarde 10-15 minutos após fazer mudanças no Supabase');
    console.log('2. Verifique se você tem permissões de admin no projeto');
    console.log('3. Tente fazer logout/login no Supabase Dashboard');
    console.log('4. Execute este script novamente para confirmar');
    
  } catch (error) {
    console.error('💥 Erro na verificação:', error.message);
    await provideFinalSolution('network_error');
  }
}

// Executar
runVerification();