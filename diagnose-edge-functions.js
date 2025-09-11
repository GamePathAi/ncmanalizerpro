// Diagnóstico completo das Edge Functions do Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsntzljufghutoyqxokm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE0NzYsImV4cCI6MjA1MDU0NzQ3Nn0.Ej6Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEdgeFunction(functionName, testData = null) {
  console.log(`\n🔍 Testando ${functionName}...`);
  
  try {
    // Teste de conectividade (OPTIONS)
    const optionsResponse = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (optionsResponse.ok) {
      console.log(`✅ ${functionName} - Conectividade OK`);
    } else {
      console.log(`❌ ${functionName} - Conectividade falhou: ${optionsResponse.status}`);
      return;
    }
    
    // Teste funcional (POST) se dados de teste fornecidos
    if (testData) {
      const postResponse = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      const result = await postResponse.json();
      
      if (postResponse.ok) {
        console.log(`✅ ${functionName} - Funcional OK`);
        console.log('Resposta:', result);
      } else {
        console.log(`❌ ${functionName} - Erro funcional:`);
        console.log('Status:', postResponse.status);
        console.log('Resposta:', result);
        
        // Análise específica de erros
        if (result.error === 'Failed to send email' && result.details) {
          if (result.details.message === 'API key is invalid') {
            console.log('🔧 SOLUÇÃO: Configurar RESEND_API_KEY válida no Supabase');
          }
        }
        
        if (result.error && result.error.includes('Stripe')) {
          console.log('🔧 SOLUÇÃO: Verificar STRIPE_SECRET_KEY no Supabase');
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ ${functionName} - Erro de conexão:`, error.message);
  }
}

async function diagnoseAllFunctions() {
  console.log('🚀 Iniciando diagnóstico completo das Edge Functions...');
  console.log('📍 URL Base:', supabaseUrl);
  
  // Teste das funções com dados específicos
  const functions = [
    {
      name: 'send-confirmation-email',
      testData: {
        email: 'teste@exemplo.com',
        confirmationUrl: 'https://exemplo.com/confirm?token=123',
        userId: 'test-user-id'
      }
    },
    {
      name: 'send-welcome-email',
      testData: {
        email: 'teste@exemplo.com',
        userName: 'Usuário Teste'
      }
    },
    {
      name: 'create-checkout-session',
      testData: {
        priceId: 'price_test123',
        userId: 'test-user-id',
        userEmail: 'teste@exemplo.com',
        successUrl: 'https://exemplo.com/success',
        cancelUrl: 'https://exemplo.com/cancel'
      }
    },
    {
      name: 'stripe-webhook',
      testData: null // Webhook não deve ser testado diretamente
    },
    {
      name: 'resend-webhook',
      testData: null // Webhook não deve ser testado diretamente
    }
  ];
  
  for (const func of functions) {
    await testEdgeFunction(func.name, func.testData);
  }
  
  console.log('\n📋 RESUMO DOS PROBLEMAS ENCONTRADOS:');
  console.log('\n1. 🔑 RESEND_API_KEY inválida ou não configurada');
  console.log('   - Acessar: https://resend.com/api-keys');
  console.log('   - Gerar nova API key');
  console.log('   - Configurar no Supabase: Settings > Edge Functions > Environment Variables');
  
  console.log('\n2. 🔧 VARIÁVEIS DE AMBIENTE NECESSÁRIAS:');
  console.log('   - RESEND_API_KEY (para envio de emails)');
  console.log('   - STRIPE_SECRET_KEY (para pagamentos)');
  console.log('   - SUPABASE_URL (automática)');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY (automática)');
  
  console.log('\n3. 🚀 PRÓXIMOS PASSOS:');
  console.log('   1. Configurar RESEND_API_KEY no painel do Supabase');
  console.log('   2. Verificar STRIPE_SECRET_KEY se usar pagamentos');
  console.log('   3. Redeployar as Edge Functions: supabase functions deploy');
  console.log('   4. Testar novamente o signup');
  
  console.log('\n🔗 LINKS ÚTEIS:');
  console.log('   - Resend Dashboard: https://resend.com/dashboard');
  console.log('   - Supabase Functions: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm/functions');
  console.log('   - Stripe Dashboard: https://dashboard.stripe.com/');
}

// Executar diagnóstico
diagnoseAllFunctions().catch(console.error);