import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkUserStatus() {
  console.log('🔍 Verificando status de todos os usuários...');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar todos os usuários na tabela user_profiles
    console.log('\n1️⃣ Buscando todos os usuários na user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.log('❌ Erro ao buscar perfis:', profilesError.message);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('📋 Nenhum usuário encontrado na tabela user_profiles');
      console.log('\n💡 POSSÍVEIS CAUSAS:');
      console.log('1. Usuários foram criados apenas no auth.users');
      console.log('2. Trigger não está funcionando');
      console.log('3. RLS está bloqueando a consulta');
      return;
    }
    
    console.log(`✅ Encontrados ${profiles.length} usuários:`);
    console.log('\n📊 DETALHES DOS USUÁRIOS:');
    console.log('-' .repeat(80));
    
    profiles.forEach((profile, index) => {
      console.log(`\n👤 Usuário ${index + 1}:`);
      console.log(`📧 Email: ${profile.email}`);
      console.log(`👤 Nome: ${profile.full_name || 'Não informado'}`);
      console.log(`📊 Status da assinatura: ${profile.subscription_status}`);
      console.log(`💳 Tipo de assinatura: ${profile.subscription_type || 'Nenhuma'}`);
      console.log(`🆔 Customer ID: ${profile.customer_id || 'Não definido'}`);
      console.log(`🔖 Subscription ID: ${profile.subscription_id || 'Não definido'}`);
      console.log(`📅 Início da assinatura: ${profile.subscription_start_date || 'Não definido'}`);
      console.log(`📅 Fim da assinatura: ${profile.subscription_end_date || 'Não definido'}`);
      console.log(`🕐 Criado em: ${new Date(profile.created_at).toLocaleString('pt-BR')}`);
      console.log(`🕐 Atualizado em: ${new Date(profile.updated_at).toLocaleString('pt-BR')}`);
      
      // Análise do status
      if (profile.subscription_status === 'active') {
        console.log('✅ STATUS: Usuário com assinatura ATIVA - deveria acessar dashboard');
      } else if (profile.subscription_status === 'pending_subscription') {
        console.log('⏳ STATUS: Usuário aguardando assinatura - vai para pricing');
      } else if (profile.subscription_status === 'pending_email') {
        console.log('📧 STATUS: Usuário aguardando confirmação de email');
      } else {
        console.log(`⚠️ STATUS: ${profile.subscription_status} - status não reconhecido`);
      }
    });
    
    // 2. Verificar usuários com assinatura ativa especificamente
    console.log('\n2️⃣ Verificando usuários com assinatura ativa...');
    const activeUsers = profiles.filter(p => p.subscription_status === 'active');
    
    if (activeUsers.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Nenhum usuário tem subscription_status = "active"');
      console.log('\n🔍 ANÁLISE:');
      
      const paidUsers = profiles.filter(p => p.customer_id && p.subscription_id);
      if (paidUsers.length > 0) {
        console.log(`⚠️ Encontrados ${paidUsers.length} usuários com dados de pagamento mas status incorreto:`);
        paidUsers.forEach(user => {
          console.log(`   - ${user.email}: ${user.subscription_status} (deveria ser "active")`);
        });
        
        console.log('\n💡 SOLUÇÃO: Atualizar status desses usuários para "active"');
      } else {
        console.log('📋 Nenhum usuário tem dados de pagamento (customer_id/subscription_id)');
        console.log('💡 Isso indica que o webhook do Stripe não está funcionando');
      }
    } else {
      console.log(`✅ Encontrados ${activeUsers.length} usuários com assinatura ativa`);
    }
    
    // 3. Verificar se há usuários no auth.users que não estão na user_profiles
    console.log('\n3️⃣ Verificando sincronização com auth.users...');
    try {
      // Tentar obter informações do usuário atual (se logado)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (user) {
        console.log(`👤 Usuário logado: ${user.email}`);
        
        // Verificar se este usuário tem perfil
        const userProfile = profiles.find(p => p.id === user.id);
        if (userProfile) {
          console.log('✅ Usuário logado tem perfil na user_profiles');
          console.log(`📊 Status atual: ${userProfile.subscription_status}`);
          
          if (userProfile.subscription_status !== 'active' && userProfile.customer_id) {
            console.log('🚨 PROBLEMA: Usuário tem customer_id mas não está ativo!');
            console.log('💡 Este é provavelmente o usuário que está sendo redirecionado incorretamente');
          }
        } else {
          console.log('❌ Usuário logado NÃO tem perfil na user_profiles');
          console.log('💡 Trigger não funcionou para este usuário');
        }
      } else {
        console.log('📋 Nenhum usuário logado no momento');
      }
    } catch (error) {
      console.log('⚠️ Não foi possível verificar usuário logado:', error.message);
    }
    
    // 4. Sugestões de correção
    console.log('\n4️⃣ SUGESTÕES DE CORREÇÃO:');
    console.log('-' .repeat(40));
    
    const usersWithPaymentData = profiles.filter(p => p.customer_id && p.subscription_id);
    if (usersWithPaymentData.length > 0) {
      console.log('\n🔧 CORREÇÃO AUTOMÁTICA DISPONÍVEL:');
      console.log('Usuários com dados de pagamento que podem ser ativados:');
      
      usersWithPaymentData.forEach(user => {
        console.log(`   - ${user.email} (${user.subscription_status} → active)`);
      });
      
      console.log('\n💡 Execute o comando para corrigir:');
      console.log('node fix-user-subscription-status.js');
    } else {
      console.log('\n🔧 CORREÇÃO MANUAL NECESSÁRIA:');
      console.log('1. Verificar se o webhook do Stripe está funcionando');
      console.log('2. Fazer um novo pagamento de teste');
      console.log('3. Verificar logs do webhook no Supabase');
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 VERIFICAÇÃO CONCLUÍDA');
}

checkUserStatus();