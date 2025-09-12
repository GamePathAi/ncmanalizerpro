import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Usar Service Role Key para bypass do RLS
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setUserActive() {
  console.log('🔧 Ativando usuário que já pagou...');
  console.log('=' .repeat(50));
  
  // Pegar email do argumento da linha de comando ou usar um padrão
  const userEmail = process.argv[2] || 'test1757595513877@gmail.com';
  
  console.log(`👤 Usuário alvo: ${userEmail}`);
  
  try {
    // 1. Verificar se o usuário existe no auth.users
    console.log('\n1️⃣ Verificando usuário no auth.users...');
    
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erro ao listar usuários:', usersError.message);
      return;
    }
    
    const targetUser = users?.find(user => user.email === userEmail);
    
    if (!targetUser) {
      console.log(`❌ Usuário ${userEmail} não encontrado no auth.users`);
      console.log('\n📋 Usuários disponíveis:');
      users?.forEach(user => console.log(`   - ${user.email}`));
      return;
    }
    
    console.log('✅ Usuário encontrado no auth.users');
    console.log(`   - ID: ${targetUser.id}`);
    console.log(`   - Email confirmado: ${targetUser.email_confirmed_at ? 'Sim' : 'Não'}`);
    console.log(`   - Criado em: ${new Date(targetUser.created_at).toLocaleString('pt-BR')}`);
    
    // 2. Verificar se já existe perfil
    console.log('\n2️⃣ Verificando perfil existente...');
    
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', targetUser.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }
    
    // 3. Criar ou atualizar perfil
    if (!existingProfile) {
      console.log('\n3️⃣ Criando novo perfil...');
      
      // Gerar códigos TOTP de backup
      const totpBackupCodes = [];
      for (let i = 0; i < 10; i++) {
        totpBackupCodes.push(Math.floor(Math.random() * 1000000).toString().padStart(6, '0'));
      }
      
      const profileData = {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.user_metadata?.full_name || targetUser.email.split('@')[0],
        subscription_status: 'active',
        subscription_type: 'annual',
        customer_id: `cus_manual_${Date.now()}`,
        subscription_id: `sub_manual_${Date.now()}`,
        subscription_start_date: new Date().toISOString(),
        totp_backup_codes: totpBackupCodes,
        created_at: targetUser.created_at,
        updated_at: new Date().toISOString()
      };
      
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ Erro ao criar perfil:', insertError.message);
        return;
      }
      
      console.log('✅ Perfil criado com sucesso!');
      console.log('📊 Status: ACTIVE (assinatura ativa)');
      
    } else {
      console.log('\n3️⃣ Atualizando perfil existente...');
      console.log(`   Status atual: ${existingProfile.subscription_status}`);
      
      const updateData = {
        subscription_status: 'active',
        subscription_type: existingProfile.subscription_type || 'annual',
        customer_id: existingProfile.customer_id || `cus_manual_${Date.now()}`,
        subscription_id: existingProfile.subscription_id || `sub_manual_${Date.now()}`,
        subscription_start_date: existingProfile.subscription_start_date || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update(updateData)
        .eq('id', targetUser.id)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Erro ao atualizar perfil:', updateError.message);
        return;
      }
      
      console.log('✅ Perfil atualizado com sucesso!');
      console.log(`📊 Status: ${existingProfile.subscription_status} → ACTIVE`);
    }
    
    // 4. Verificar resultado final
    console.log('\n4️⃣ Verificando resultado final...');
    
    const { data: finalProfile, error: finalError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', targetUser.id)
      .single();
    
    if (finalError) {
      console.log('❌ Erro ao verificar perfil final:', finalError.message);
    } else {
      console.log('✅ Perfil configurado com sucesso!');
      console.log('\n📊 DADOS FINAIS:');
      console.log(`   - Email: ${finalProfile.email}`);
      console.log(`   - Nome: ${finalProfile.full_name}`);
      console.log(`   - Status: ${finalProfile.subscription_status}`);
      console.log(`   - Tipo: ${finalProfile.subscription_type}`);
      console.log(`   - Customer ID: ${finalProfile.customer_id}`);
      console.log(`   - Subscription ID: ${finalProfile.subscription_id}`);
      console.log(`   - Início: ${finalProfile.subscription_start_date}`);
    }
    
    // 5. Testar acesso
    console.log('\n5️⃣ Testando lógica de acesso...');
    
    if (finalProfile?.subscription_status === 'active') {
      console.log('✅ SUCESSO: Usuário agora tem assinatura ativa!');
      console.log('🎯 Resultado esperado: Deve acessar o DASHBOARD');
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. Faça login com este usuário');
      console.log('2. Deve ser redirecionado para o dashboard');
      console.log('3. Se ainda for para pricing, verifique o AuthContext');
    } else {
      console.log('❌ PROBLEMA: Status não foi atualizado corretamente');
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 ATIVAÇÃO CONCLUÍDA!');
}

// Verificar se foi fornecido um email
if (process.argv.length < 3) {
  console.log('💡 Uso: node set-user-active.js [email]');
  console.log('📧 Exemplo: node set-user-active.js usuario@exemplo.com');
  console.log('\n🔄 Usando email padrão do teste...');
}

setUserActive();