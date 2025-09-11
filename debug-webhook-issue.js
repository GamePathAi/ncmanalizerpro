import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugWebhookIssue() {
  console.log('🔍 Investigando problema do webhook...');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar se há usuários no auth.users
    console.log('\n1️⃣ Verificando usuários no auth.users...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erro ao listar usuários:', usersError.message);
      console.log('💡 Isso é normal - precisamos usar Service Role Key para acessar auth.users');
    } else {
      console.log(`✅ Encontrados ${users?.length || 0} usuários no auth.users`);
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'})`);
        });
      }
    }
    
    // 2. Verificar se há perfis na user_profiles
    console.log('\n2️⃣ Verificando perfis na user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(10);
    
    if (profilesError) {
      console.log('❌ Erro ao buscar perfis:', profilesError.message);
    } else {
      console.log(`📊 Encontrados ${profiles?.length || 0} perfis na user_profiles`);
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.email} - Status: ${profile.subscription_status}`);
        });
      }
    }
    
    // 3. Simular um pagamento bem-sucedido
    console.log('\n3️⃣ Simulando webhook de pagamento...');
    
    // Primeiro, vamos criar um usuário de teste se não existir
    const testEmail = 'test-webhook@example.com';
    const testUserId = crypto.randomUUID();
    
    console.log(`📧 Criando usuário de teste: ${testEmail}`);
    
    // Tentar inserir diretamente na user_profiles (simulando o que o webhook deveria fazer)
    const { data: testProfile, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        full_name: 'Usuário Teste Webhook',
        subscription_status: 'pending_subscription',
        totp_backup_codes: ['123456', '789012', '345678']
      })
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Erro ao criar perfil de teste:', insertError.message);
      
      if (insertError.code === '42501') {
        console.log('\n🛡️ Problema de RLS detectado!');
        console.log('💡 O webhook precisa usar Service Role Key para inserir dados');
        console.log('📋 Verificar se SUPABASE_SERVICE_ROLE_KEY está configurada no webhook');
      }
    } else {
      console.log('✅ Perfil de teste criado com sucesso!');
      
      // Agora simular o webhook atualizando para ativo
      console.log('\n🔄 Simulando atualização do webhook (pagamento aprovado)...');
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          subscription_status: 'active',
          subscription_type: 'annual',
          customer_id: 'cus_test_webhook_' + Date.now(),
          subscription_id: 'sub_test_webhook_' + Date.now(),
          subscription_start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', testUserId)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Erro ao atualizar perfil:', updateError.message);
      } else {
        console.log('✅ Perfil atualizado para ativo!');
        console.log('📊 Status final:', updatedProfile.subscription_status);
        
        // Verificar se agora aparece na consulta de usuários ativos
        console.log('\n🔍 Verificando se aparece como usuário ativo...');
        const { data: activeUsers, error: activeError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('subscription_status', 'active');
        
        if (activeError) {
          console.log('❌ Erro ao buscar usuários ativos:', activeError.message);
        } else {
          console.log(`✅ Usuários ativos encontrados: ${activeUsers?.length || 0}`);
          if (activeUsers && activeUsers.length > 0) {
            activeUsers.forEach((user, index) => {
              console.log(`   ${index + 1}. ${user.email} - ${user.subscription_type}`);
            });
          }
        }
        
        // Limpar o usuário de teste
        setTimeout(async () => {
          await supabase.from('user_profiles').delete().eq('id', testUserId);
          console.log('🧹 Usuário de teste removido');
        }, 2000);
      }
    }
    
    // 4. Verificar configuração do webhook
    console.log('\n4️⃣ Verificando configuração do webhook...');
    
    const webhookUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`;
    console.log('📡 URL do webhook:', webhookUrl);
    
    // Tentar fazer uma requisição de teste para o webhook
    console.log('\n🧪 Testando conectividade do webhook...');
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status da resposta:', response.status);
      
      if (response.status === 405) {
        console.log('✅ Webhook está ativo (Method Not Allowed é esperado para GET)');
      } else if (response.status === 404) {
        console.log('❌ Webhook não encontrado - Edge Function não foi deployada');
      } else {
        console.log('⚠️ Status inesperado:', response.status);
      }
    } catch (fetchError) {
      console.log('❌ Erro ao conectar com webhook:', fetchError.message);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📋 DIAGNÓSTICO COMPLETO:');
    console.log('\n🔍 POSSÍVEIS CAUSAS DO PROBLEMA:');
    console.log('1. Edge Function stripe-webhook não foi deployada');
    console.log('2. Webhook não tem Service Role Key configurada');
    console.log('3. URL do webhook no Stripe está incorreta');
    console.log('4. Webhook não está recebendo os eventos do Stripe');
    console.log('5. RLS está bloqueando inserções do webhook');
    
    console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
    console.log('1. Verificar se Edge Function foi deployada no Supabase');
    console.log('2. Configurar SUPABASE_SERVICE_ROLE_KEY no webhook');
    console.log('3. Verificar URL do webhook no Stripe Dashboard');
    console.log('4. Testar webhook com evento real do Stripe');
    console.log('5. Verificar logs do webhook no Supabase Dashboard');
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err.message);
  }
}

debugWebhookIssue();