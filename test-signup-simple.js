import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSimpleSignup() {
  console.log('🧪 Testando cadastro simples (sem email)...');
  
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    console.log(`📧 Tentando cadastrar: ${testEmail}`);
    
    // Teste 1: Cadastro básico
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: undefined // Não redirecionar
      }
    });
    
    if (signupError) {
      console.error('❌ Erro no cadastro:', signupError.message);
      console.error('📋 Código:', signupError.status);
      console.error('📋 Detalhes:', signupError);
      return false;
    }
    
    console.log('✅ Cadastro realizado!');
    console.log('👤 ID do usuário:', signupData.user?.id);
    console.log('📧 Email:', signupData.user?.email);
    console.log('✉️ Email confirmado:', !!signupData.user?.email_confirmed_at);
    console.log('🔐 Sessão criada:', !!signupData.session);
    
    // Teste 2: Tentar fazer login imediatamente
    console.log('\n🔐 Testando login imediato...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      
      if (loginError.message.includes('Email not confirmed')) {
        console.log('⚠️ Email ainda precisa ser confirmado');
        console.log('💡 Solução: Desabilitar "Enable email confirmations" no Supabase');
      }
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('🎉 CONFIGURAÇÃO FUNCIONANDO PERFEITAMENTE!');
    }
    
    return true;
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err.message);
    return false;
  }
}

async function checkAuthSettings() {
  console.log('🔍 Verificando configurações de autenticação...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('📊 Sessão atual:', data.session ? 'Ativa' : 'Nenhuma');
    
    // Teste de conectividade
    const { error: testError } = await supabase.auth.signInWithPassword({
      email: 'test@invalid.com',
      password: 'invalid'
    });
    
    if (testError && testError.message.includes('Invalid login credentials')) {
      console.log('✅ Servidor Supabase respondendo normalmente');
    }
    
  } catch (err) {
    console.error('❌ Erro na verificação:', err.message);
  }
}

async function main() {
  console.log('🚀 Teste de Cadastro Simplificado');
  console.log('=' .repeat(50));
  console.log('🔗 URL:', process.env.VITE_SUPABASE_URL);
  console.log('🔑 Chave (primeiros 20):', process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  console.log('');
  
  await checkAuthSettings();
  console.log('');
  
  const success = await testSimpleSignup();
  
  console.log('');
  console.log('=' .repeat(50));
  
  if (success) {
    console.log('🎉 RESULTADO: Cadastro funcionando!');
  } else {
    console.log('❌ RESULTADO: Ainda há problemas');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se "Enable email confirmations" está DESMARCADO');
    console.log('2. Configurar SMTP customizado se necessário');
    console.log('3. Verificar logs do Supabase Dashboard');
  }
}

main().catch(console.error);