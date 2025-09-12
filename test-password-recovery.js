import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Testar localmente primeiro
const SUPABASE_FUNCTION_URL = 'http://127.0.0.1:54321';
const LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const testEmail = 'gamepathai@gmail.com'; // Email autorizado no Resend

async function testPasswordRecovery() {
  console.log('🔐 Testando Sistema de Recuperação de Senha');
  console.log('=' .repeat(50));

  try {
    // 1. Testar endpoint de forgot-password
    console.log('\n1. 📧 Testando envio de email de recuperação...');
    
    const forgotResponse = await fetch(`${SUPABASE_FUNCTION_URL}/functions/v1/password-recovery/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCAL_ANON_KEY}`,
      },
      body: JSON.stringify({ email: testEmail })
    });

    const forgotData = await forgotResponse.json();
    
    if (forgotResponse.ok) {
      console.log('✅ Email de recuperação enviado com sucesso!');
      console.log('📧 Resposta:', forgotData);
    } else {
      console.log('❌ Erro ao enviar email:', forgotData);
      return;
    }

    // 2. Simular verificação de token (usando um token fictício)
    console.log('\n2. 🔍 Testando verificação de token...');
    
    const verifyResponse = await fetch(`${SUPABASE_FUNCTION_URL}/functions/v1/password-recovery/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCAL_ANON_KEY}`,
      },
      body: JSON.stringify({ token: 'fake-token-for-testing' })
    });

    const verifyData = await verifyResponse.json();
    
    if (verifyResponse.status === 400 && verifyData.error === 'Token inválido ou expirado') {
      console.log('✅ Validação de token funcionando corretamente (token inválido rejeitado)');
    } else {
      console.log('⚠️ Resposta inesperada na verificação de token:', verifyData);
    }

    // 3. Testar reset-password com token inválido
    console.log('\n3. 🔄 Testando reset de senha com token inválido...');
    
    const resetResponse = await fetch(`${SUPABASE_FUNCTION_URL}/functions/v1/password-recovery/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCAL_ANON_KEY}`,
      },
      body: JSON.stringify({ 
        token: 'fake-token-for-testing',
        password: 'newpassword123'
      })
    });

    const resetData = await resetResponse.json();
    
    if (resetResponse.status === 400 && resetData.error === 'Token inválido ou expirado') {
      console.log('✅ Reset de senha funcionando corretamente (token inválido rejeitado)');
    } else {
      console.log('⚠️ Resposta inesperada no reset de senha:', resetData);
    }

    console.log('\n🎉 Teste de recuperação de senha concluído!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Verifique o email em gamepathai@gmail.com');
    console.log('2. Clique no link de recuperação');
    console.log('3. Teste o reset de senha com token válido');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testPasswordRecovery();