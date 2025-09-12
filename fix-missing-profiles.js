import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Usar Service Role Key para acessar auth.users
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixMissingProfiles() {
  console.log('🔧 Corrigindo perfis ausentes...');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar usuários no auth.users
    console.log('\n1️⃣ Buscando usuários no auth.users...');
    
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erro ao listar usuários do auth:', usersError.message);
      console.log('💡 Verifique se SUPABASE_SERVICE_ROLE_KEY está configurada corretamente');
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('📋 Nenhum usuário encontrado no auth.users');
      return;
    }
    
    console.log(`✅ Encontrados ${users.length} usuários no auth.users:`);
    
    // 2. Verificar quais usuários não têm perfil
    console.log('\n2️⃣ Verificando perfis existentes...');
    
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id');
    
    if (profilesError) {
      console.log('❌ Erro ao buscar perfis existentes:', profilesError.message);
      return;
    }
    
    const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || []);
    const usersWithoutProfiles = users.filter(user => !existingProfileIds.has(user.id));
    
    console.log(`📊 Usuários sem perfil: ${usersWithoutProfiles.length}`);
    
    if (usersWithoutProfiles.length === 0) {
      console.log('✅ Todos os usuários já têm perfis!');
      return;
    }
    
    // 3. Criar perfis para usuários sem perfil
    console.log('\n3️⃣ Criando perfis ausentes...');
    
    for (const user of usersWithoutProfiles) {
      console.log(`\n👤 Criando perfil para: ${user.email}`);
      
      // Determinar status baseado na confirmação de email
      const subscriptionStatus = user.email_confirmed_at ? 'pending_subscription' : 'pending_email';
      
      // Gerar códigos TOTP de backup
      const totpBackupCodes = [];
      for (let i = 0; i < 10; i++) {
        totpBackupCodes.push(Math.floor(Math.random() * 1000000).toString().padStart(6, '0'));
      }
      
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        subscription_status: subscriptionStatus,
        totp_backup_codes: totpBackupCodes,
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      };
      
      // Usar Service Role para inserir (bypass RLS)
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (insertError) {
        console.log(`❌ Erro ao criar perfil para ${user.email}:`, insertError.message);
      } else {
        console.log(`✅ Perfil criado com sucesso!`);
        console.log(`   - Status: ${subscriptionStatus}`);
        console.log(`   - Email confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
      }
    }
    
    // 4. Verificar se algum usuário deveria ter assinatura ativa
    console.log('\n4️⃣ Verificando usuários que podem ter assinatura ativa...');
    
    // Buscar usuários que podem ter feito pagamento
    const confirmedUsers = users.filter(user => user.email_confirmed_at);
    
    if (confirmedUsers.length > 0) {
      console.log(`\n📧 Usuários com email confirmado (${confirmedUsers.length}):`);
      
      for (const user of confirmedUsers) {
        console.log(`   - ${user.email} (criado em: ${new Date(user.created_at).toLocaleString('pt-BR')})`);
      }
      
      console.log('\n💡 AÇÃO NECESSÁRIA:');
      console.log('Se algum desses usuários já fez pagamento:');
      console.log('1. Verifique no Stripe Dashboard se há pagamentos');
      console.log('2. Execute: node update-paid-user-status.js [email]');
      console.log('3. Ou atualize manualmente o status para "active"');
    }
    
    // 5. Verificar perfis criados
    console.log('\n5️⃣ Verificando perfis após correção...');
    
    const { data: allProfiles, error: finalError } = await supabase
      .from('user_profiles')
      .select('email, subscription_status, created_at')
      .order('created_at', { ascending: false });
    
    if (finalError) {
      console.log('❌ Erro ao verificar perfis finais:', finalError.message);
    } else {
      console.log(`✅ Total de perfis agora: ${allProfiles?.length || 0}`);
      
      if (allProfiles && allProfiles.length > 0) {
        console.log('\n📊 PERFIS ATUAIS:');
        allProfiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.email} - ${profile.subscription_status}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 CORREÇÃO CONCLUÍDA!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Faça login com seu usuário');
  console.log('2. Se ainda for para pricing, execute: node set-user-active.js [seu-email]');
  console.log('3. Teste o acesso ao dashboard');
}

fixMissingProfiles();