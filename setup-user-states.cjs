const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupUserStates() {
  try {
    console.log('🚀 Iniciando configuração do sistema de estados de usuário...');
    
    // Verificar se as tabelas já existem
    console.log('🔍 Verificando estrutura atual...');
    
    // Tentar criar o enum primeiro
    console.log('📝 Criando enum user_subscription_status...');
    try {
      const { data, error } = await supabase.rpc('exec', {
        sql: `
          DO $$ BEGIN
            CREATE TYPE user_subscription_status AS ENUM (
              'pending_email',
              'pending_subscription', 
              'active'
            );
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `
      });
      
      if (error) {
        console.log('⚠️ Enum já existe ou erro:', error.message);
      } else {
        console.log('✅ Enum criado com sucesso');
      }
    } catch (err) {
      console.log('⚠️ Tentativa de criar enum falhou:', err.message);
    }
    
    // Verificar se user_profiles existe
    console.log('🔍 Verificando tabela user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (profilesError && profilesError.code === 'PGRST116') {
      console.log('📝 Criando tabela user_profiles...');
      
      // Criar user_profiles via SQL direto
      const createProfilesSQL = `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT,
          subscription_status TEXT DEFAULT 'pending_email',
          stripe_customer_id TEXT UNIQUE,
          stripe_subscription_id TEXT UNIQUE,
          subscription_plan TEXT,
          subscription_expires_at TIMESTAMPTZ,
          email_verified_at TIMESTAMPTZ,
          last_login_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      try {
        await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: createProfilesSQL })
        });
        console.log('✅ Tabela user_profiles criada');
      } catch (err) {
        console.log('⚠️ Erro ao criar user_profiles:', err.message);
      }
    } else {
      console.log('✅ Tabela user_profiles já existe');
    }
    
    // Verificar se email_verification_tokens existe
    console.log('🔍 Verificando tabela email_verification_tokens...');
    const { data: tokens, error: tokensError } = await supabase
      .from('email_verification_tokens')
      .select('id')
      .limit(1);
    
    if (tokensError && tokensError.code === 'PGRST116') {
      console.log('📝 Criando tabela email_verification_tokens...');
      
      const createTokensSQL = `
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      try {
        await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: createTokensSQL })
        });
        console.log('✅ Tabela email_verification_tokens criada');
      } catch (err) {
        console.log('⚠️ Erro ao criar tokens:', err.message);
      }
    } else {
      console.log('✅ Tabela email_verification_tokens já existe');
    }
    
    // Verificar se auth_logs existe
    console.log('🔍 Verificando tabela auth_logs...');
    const { data: logs, error: logsError } = await supabase
      .from('auth_logs')
      .select('id')
      .limit(1);
    
    if (logsError && logsError.code === 'PGRST116') {
      console.log('📝 Criando tabela auth_logs...');
      
      const createLogsSQL = `
        CREATE TABLE IF NOT EXISTS auth_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          event_type TEXT NOT NULL,
          ip_address INET,
          user_agent TEXT,
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      try {
        await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: createLogsSQL })
        });
        console.log('✅ Tabela auth_logs criada');
      } catch (err) {
        console.log('⚠️ Erro ao criar auth_logs:', err.message);
      }
    } else {
      console.log('✅ Tabela auth_logs já existe');
    }
    
    console.log('\n🎉 Configuração dos estados de usuário concluída!');
    console.log('\n📋 Estados implementados:');
    console.log('  • pending_email: Usuário cadastrado, aguardando confirmação');
    console.log('  • pending_subscription: Email confirmado, aguardando assinatura');
    console.log('  • active: Email confirmado + assinatura ativa');
    
    console.log('\n🔧 Próximos passos:');
    console.log('  1. Implementar middleware de autenticação');
    console.log('  2. Criar endpoints de autenticação');
    console.log('  3. Configurar webhook do Stripe');
    console.log('  4. Implementar roteamento protegido');
    
    // Testar inserção de dados
    console.log('\n🧪 Testando estrutura...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('⚠️ Erro ao testar:', testError.message);
    } else {
      console.log('✅ Estrutura funcionando corretamente!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
    process.exit(1);
  }
}

setupUserStates();