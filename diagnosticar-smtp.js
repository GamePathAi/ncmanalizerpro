import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnosticarSMTP() {
  console.log('🔍 DIAGNÓSTICO DE CONFIGURAÇÃO SMTP');
  console.log('=' .repeat(50));
  
  try {
    // Verificar variáveis de ambiente
    console.log('1️⃣ Verificando variáveis de ambiente...');
    console.log(`✅ SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? 'Configurada' : '❌ Não encontrada'}`);
    console.log(`✅ SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : '❌ Não encontrada'}`);
    console.log(`✅ RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'Configurada' : '❌ Não encontrada'}`);
    
    // Testar conexão com Supabase
    console.log('\n2️⃣ Testando conexão com Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro na conexão:', testError.message);
    } else {
      console.log('✅ Conexão com Supabase funcionando');
    }
    
    // Verificar configurações de autenticação
    console.log('\n3️⃣ Verificando configurações de Auth...');
    
    // Tentar um cadastro simples para ver o erro específico
    console.log('\n4️⃣ Testando cadastro para capturar erro específico...');
    const emailTeste = `diagnostico-${Date.now()}@teste.com`;
    
    const { data, error } = await supabase.auth.signUp({
      email: emailTeste,
      password: 'Teste123!@#'
    });
    
    if (error) {
      console.log('❌ Erro detalhado:', error);
      console.log('📋 Mensagem:', error.message);
      console.log('🔍 Status:', error.status);
      
      if (error.message.includes('confirmation email')) {
        console.log('\n🎯 PROBLEMA IDENTIFICADO: Erro no envio de email');
        console.log('\n🔧 POSSÍVEIS CAUSAS:');
        console.log('1. SMTP não configurado corretamente no Supabase');
        console.log('2. Credenciais do Resend incorretas');
        console.log('3. Domínio não verificado no Resend');
        console.log('4. Rate limit do Resend atingido');
        
        console.log('\n✅ SOLUÇÕES:');
        console.log('1. Verificar configuração SMTP no Supabase:');
        console.log('   - Host: smtp.resend.com');
        console.log('   - Port: 465');
        console.log('   - Username: resend');
        console.log(`   - Password: ${process.env.RESEND_API_KEY}`);
        console.log('   - Sender: noreply@ncmanalyzer.com.br');
        
        console.log('\n2. Verificar no Dashboard do Supabase:');
        console.log('   - Authentication > Settings > SMTP Settings');
        console.log('   - Confirmar se "Enable custom SMTP" está marcado');
        console.log('   - Testar configuração com "Send test email"');
        
        console.log('\n3. Verificar logs:');
        console.log('   - Authentication > Logs no Supabase');
        console.log('   - Procurar por erros de SMTP');
      }
    } else {
      console.log('✅ Cadastro funcionou! Verificar se email foi enviado.');
      console.log('👤 Usuário criado:', data.user?.email);
    }
    
    console.log('\n📋 CHECKLIST DE VERIFICAÇÃO:');
    console.log('□ SMTP habilitado no Supabase');
    console.log('□ Credenciais corretas (host, port, username, password)');
    console.log('□ Email remetente configurado');
    console.log('□ Domínio verificado no Resend');
    console.log('□ API Key do Resend válida');
    console.log('□ Templates de email configurados');
    
    console.log('\n🔗 LINKS ÚTEIS:');
    console.log('- Dashboard Supabase: https://supabase.com/dashboard');
    console.log('- Dashboard Resend: https://resend.com/dashboard');
    console.log('- Documentação SMTP: https://supabase.com/docs/guides/auth/auth-smtp');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar diagnóstico
diagnosticarSMTP();