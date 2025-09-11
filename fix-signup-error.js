import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão no .env');
  process.exit(1);
}

// Cliente normal (como no frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔧 Diagnóstico do Erro "Failed to fetch" no Signup');
console.log('================================================');
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
console.log('');

async function diagnoseProblem() {
  console.log('🔍 DIAGNÓSTICO DO PROBLEMA:');
  console.log('---------------------------');
  
  // 1. Testar signup básico
  console.log('\n1. Testando signup básico...');
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log('📧 Email de teste:', testEmail);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.log('❌ Erro no signup:', error.message);
      console.log('🔍 Status:', error.status);
      console.log('🔍 Nome:', error.name);
      
      // Analisar tipo de erro
      if (error.message.includes('confirmation') || 
          error.message.includes('email') || 
          error.message.includes('Error sending confirmation email')) {
        console.log('\n🎯 PROBLEMA IDENTIFICADO: Confirmação de email');
        console.log('Causa: Supabase tentando enviar email sem SMTP configurado');
        return 'email_confirmation';
      }
      
      if (error.message.includes('trigger') || error.message.includes('function')) {
        console.log('\n🎯 PROBLEMA IDENTIFICADO: Trigger do banco');
        console.log('Causa: Trigger tentando executar função inexistente');
        return 'database_trigger';
      }
      
      if (error.message.includes('policy') || error.message.includes('RLS')) {
        console.log('\n🎯 PROBLEMA IDENTIFICADO: Row Level Security');
        console.log('Causa: Políticas de segurança bloqueando inserção');
        return 'rls_policy';
      }
      
      if (error.status === 500) {
        console.log('\n🎯 PROBLEMA IDENTIFICADO: Erro interno do servidor');
        console.log('Causa: Provavelmente relacionado a email ou trigger');
        return 'server_error';
      }
      
      return 'unknown';
    } else {
      console.log('✅ Signup funcionou! Usuário criado:', data.user?.id);
      console.log('📧 Email confirmado:', data.user?.email_confirmed_at ? 'SIM' : 'NÃO');
      return 'working';
    }
  } catch (fetchError) {
    console.log('❌ Erro de fetch capturado:', fetchError.message);
    console.log('🔍 Tipo:', fetchError.name);
    console.log('🎯 PROBLEMA IDENTIFICADO: Erro de conectividade ou CORS');
    return 'connectivity';
  }
}

async function testBasicConnection() {
  console.log('\n2. Testando conectividade básica...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️  Erro ao obter sessão:', error.message);
    } else {
      console.log('✅ Conectividade básica OK');
      console.log('📊 Sessão atual:', data.session ? 'Ativa' : 'Nenhuma');
    }
  } catch (error) {
    console.log('❌ Erro de conectividade:', error.message);
  }
}

async function provideSolution(problemType) {
  console.log('\n🚀 SOLUÇÕES RECOMENDADAS:');
  console.log('=========================');
  
  switch (problemType) {
    case 'email_confirmation':
    case 'server_error':
      console.log('\n📧 PROBLEMA: Confirmação de Email / Erro 500');
      console.log('\n✅ SOLUÇÃO RÁPIDA (5 minutos):');
      console.log('1. Acesse: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm');
      console.log('2. Vá para Authentication > Settings');
      console.log('3. Na seção "User Signups", DESMARQUE "Enable email confirmations"');
      console.log('4. Clique em "Save" ou "Update"');
      console.log('5. Aguarde 1-2 minutos para aplicar');
      console.log('6. Teste novamente no frontend');
      console.log('\n💡 EXPLICAÇÃO:');
      console.log('O erro "Failed to fetch" acontece porque o Supabase tenta enviar');
      console.log('um email de confirmação, mas não tem SMTP configurado.');
      console.log('Desabilitando a confirmação, o signup funcionará normalmente.');
      break;
      
    case 'database_trigger':
      console.log('\n🔧 PROBLEMA: Trigger do Banco');
      console.log('\n✅ SOLUÇÃO:');
      console.log('1. Verifique se há triggers configurados no banco');
      console.log('2. Desabilite triggers temporariamente');
      console.log('3. Configure Edge Functions se necessário');
      break;
      
    case 'rls_policy':
      console.log('\n🔒 PROBLEMA: Row Level Security');
      console.log('\n✅ SOLUÇÃO:');
      console.log('1. Revise políticas RLS na tabela user_profiles');
      console.log('2. Certifique-se de que usuários podem inserir seus próprios dados');
      break;
      
    case 'connectivity':
      console.log('\n🌐 PROBLEMA: Conectividade / CORS');
      console.log('\n✅ SOLUÇÃO:');
      console.log('1. Verifique conexão com internet');
      console.log('2. Teste URL do Supabase no navegador');
      console.log('3. Desabilite proxy/VPN temporariamente');
      console.log('4. Limpe cache do navegador (Ctrl+Shift+R)');
      break;
      
    case 'working':
      console.log('\n🎉 SISTEMA FUNCIONANDO!');
      console.log('O problema pode ter sido temporário ou já foi resolvido.');
      console.log('Teste no frontend para confirmar.');
      break;
      
    default:
      console.log('\n❓ PROBLEMA DESCONHECIDO');
      console.log('\n✅ SOLUÇÕES GERAIS:');
      console.log('1. Desabilite confirmação de email (mais provável)');
      console.log('2. Verifique logs do Supabase Dashboard');
      console.log('3. Teste com email diferente');
      console.log('4. Limpe cache do navegador');
  }
}

async function showNextSteps() {
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. ✅ Aplicar a solução recomendada acima');
  console.log('2. 🧪 Testar signup no frontend (http://localhost:5173)');
  console.log('3. 🔄 Se ainda houver erro, executar este script novamente');
  console.log('4. 📧 Configurar SMTP posteriormente se quiser emails');
  console.log('');
  console.log('🔗 Links úteis:');
  console.log('- Supabase Dashboard: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm');
  console.log('- Authentication Settings: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/auth/settings');
  console.log('- Frontend: http://localhost:5173');
}

// Executar diagnóstico completo
async function runDiagnosis() {
  try {
    const problemType = await diagnoseProblem();
    await testBasicConnection();
    await provideSolution(problemType);
    await showNextSteps();
    
    console.log('\n📊 RESUMO:');
    console.log('==========');
    console.log('🔍 Problema identificado:', problemType.toUpperCase());
    console.log('🎯 Solução principal: Desabilitar confirmação de email');
    console.log('⏱️  Tempo estimado: 5 minutos');
    console.log('✅ Resultado esperado: Signup funcionando sem "Failed to fetch"');
    
  } catch (error) {
    console.error('💥 Erro no diagnóstico:', error.message);
    console.log('\n🆘 SOLUÇÃO DE EMERGÊNCIA:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/auth/settings');
    console.log('2. Desmarque "Enable email confirmations"');
    console.log('3. Salve as alterações');
  }
}

// Executar
runDiagnosis();