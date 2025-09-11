import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const execAsync = promisify(exec);

async function deployEdgeFunctions() {
  console.log('🚀 Deployando Edge Functions...');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar se Supabase CLI está instalado
    console.log('\n1️⃣ Verificando Supabase CLI...');
    try {
      const { stdout } = await execAsync('supabase --version');
      console.log('✅ Supabase CLI encontrado:', stdout.trim());
    } catch (error) {
      console.log('❌ Supabase CLI não encontrado');
      console.log('💡 Instale com: npm install -g supabase');
      console.log('📋 Ou baixe em: https://supabase.com/docs/guides/cli');
      return;
    }
    
    // 2. Verificar se está logado no Supabase
    console.log('\n2️⃣ Verificando login no Supabase...');
    try {
      await execAsync('supabase projects list');
      console.log('✅ Logado no Supabase');
    } catch (error) {
      console.log('❌ Não está logado no Supabase');
      console.log('💡 Faça login com: supabase login');
      return;
    }
    
    // 3. Verificar estrutura das Edge Functions
    console.log('\n3️⃣ Verificando estrutura das Edge Functions...');
    
    const functionsDir = path.join(process.cwd(), 'supabase', 'functions');
    const stripeWebhookDir = path.join(functionsDir, 'stripe-webhook');
    const emailFunctionDir = path.join(functionsDir, 'send-confirmation-email');
    
    if (fs.existsSync(stripeWebhookDir)) {
      console.log('✅ stripe-webhook encontrada');
    } else {
      console.log('❌ stripe-webhook não encontrada');
    }
    
    if (fs.existsSync(emailFunctionDir)) {
      console.log('✅ send-confirmation-email encontrada');
    } else {
      console.log('❌ send-confirmation-email não encontrada');
    }
    
    // 4. Verificar variáveis de ambiente necessárias
    console.log('\n4️⃣ Verificando variáveis de ambiente...');
    
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'RESEND_API_KEY'
    ];
    
    const missingVars = [];
    requiredEnvVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: Configurada`);
      } else {
        console.log(`❌ ${varName}: Ausente`);
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      console.log('\n⚠️ Variáveis ausentes encontradas!');
      console.log('💡 Configure no arquivo .env antes de continuar');
    }
    
    // 5. Criar arquivo de configuração das Edge Functions
    console.log('\n5️⃣ Criando configuração das Edge Functions...');
    
    const envConfig = {
      SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'CONFIGURE_NO_SUPABASE_DASHBOARD',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY
    };
    
    console.log('📋 Configurações que serão deployadas:');
    Object.entries(envConfig).forEach(([key, value]) => {
      if (value && value !== 'CONFIGURE_NO_SUPABASE_DASHBOARD') {
        console.log(`   ${key}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`   ${key}: ❌ NÃO CONFIGURADA`);
      }
    });
    
    // 6. Tentar deploy das Edge Functions
    console.log('\n6️⃣ Deployando Edge Functions...');
    
    if (fs.existsSync(stripeWebhookDir)) {
      console.log('\n🔄 Deployando stripe-webhook...');
      try {
        const { stdout, stderr } = await execAsync('supabase functions deploy stripe-webhook', {
          cwd: process.cwd()
        });
        console.log('✅ stripe-webhook deployada com sucesso!');
        if (stdout) console.log('📋 Output:', stdout);
      } catch (error) {
        console.log('❌ Erro ao deployar stripe-webhook:', error.message);
        if (error.stderr) console.log('📋 Stderr:', error.stderr);
      }
    }
    
    if (fs.existsSync(emailFunctionDir)) {
      console.log('\n🔄 Deployando send-confirmation-email...');
      try {
        const { stdout, stderr } = await execAsync('supabase functions deploy send-confirmation-email', {
          cwd: process.cwd()
        });
        console.log('✅ send-confirmation-email deployada com sucesso!');
        if (stdout) console.log('📋 Output:', stdout);
      } catch (error) {
        console.log('❌ Erro ao deployar send-confirmation-email:', error.message);
        if (error.stderr) console.log('📋 Stderr:', error.stderr);
      }
    }
    
    // 7. Testar as Edge Functions deployadas
    console.log('\n7️⃣ Testando Edge Functions deployadas...');
    
    const webhookUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`;
    const emailUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/send-confirmation-email`;
    
    console.log('\n🧪 Testando stripe-webhook...');
    try {
      const response = await fetch(webhookUrl, { method: 'GET' });
      console.log(`📊 Status: ${response.status}`);
      if (response.status === 405) {
        console.log('✅ stripe-webhook está ativa (405 Method Not Allowed é esperado)');
      } else if (response.status === 404) {
        console.log('❌ stripe-webhook não encontrada (ainda não deployada)');
      } else {
        console.log('⚠️ Status inesperado');
      }
    } catch (error) {
      console.log('❌ Erro ao testar webhook:', error.message);
    }
    
    console.log('\n🧪 Testando send-confirmation-email...');
    try {
      const response = await fetch(emailUrl, { method: 'GET' });
      console.log(`📊 Status: ${response.status}`);
      if (response.status === 405 || response.status === 400) {
        console.log('✅ send-confirmation-email está ativa');
      } else if (response.status === 404) {
        console.log('❌ send-confirmation-email não encontrada');
      } else {
        console.log('⚠️ Status inesperado');
      }
    } catch (error) {
      console.log('❌ Erro ao testar email function:', error.message);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📋 RESUMO DO DEPLOY:');
    console.log('\n✅ PRÓXIMOS PASSOS:');
    console.log('1. Configurar SUPABASE_SERVICE_ROLE_KEY no Supabase Dashboard');
    console.log('2. Atualizar URL do webhook no Stripe Dashboard');
    console.log('3. Testar um pagamento real');
    console.log('4. Verificar logs das Edge Functions');
    
    console.log('\n🔗 URLS IMPORTANTES:');
    console.log(`📡 Webhook URL: ${webhookUrl}`);
    console.log(`📧 Email Function URL: ${emailUrl}`);
    
    console.log('\n💡 CONFIGURAÇÃO NO STRIPE:');
    console.log('1. Acesse Stripe Dashboard > Developers > Webhooks');
    console.log('2. Adicione endpoint:', webhookUrl);
    console.log('3. Eventos necessários:');
    console.log('   - checkout.session.completed');
    console.log('   - customer.subscription.created');
    console.log('   - customer.subscription.updated');
    console.log('   - customer.subscription.deleted');
    console.log('   - invoice.payment_succeeded');
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err.message);
  }
}

deployEdgeFunctions();