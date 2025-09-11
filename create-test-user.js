import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestUser() {
  console.log('🧪 Criando usuário de teste com assinatura ativa...');
  console.log('=' .repeat(50));
  
  try {
    // Primeiro, vamos tentar criar um usuário via auth
    const testEmail = `test-user-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Tentando criar usuário: ${testEmail}`);
    
    // Tentar signup (pode falhar devido ao email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Teste'
        }
      }
    });
    
    if (authError) {
      console.log('⚠️ Erro no signup (esperado):', authError.message);
      console.log('\n🔄 Tentando abordagem alternativa...');
      
      // Se o signup falhar, vamos criar um perfil diretamente
      // Primeiro, gerar um UUID fictício
      const fakeUserId = crypto.randomUUID();
      
      console.log(`🆔 Criando perfil com ID fictício: ${fakeUserId}`);
      
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: fakeUserId,
          email: testEmail,
          full_name: 'Usuário Teste',
          subscription_status: 'active',
          subscription_type: 'annual',
          subscription_start_date: new Date().toISOString(),
          customer_id: 'cus_test_' + Date.now(),
          subscription_id: 'sub_test_' + Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (profileError) {
        console.log('❌ Erro ao criar perfil:', profileError.message);
        console.log('📋 Detalhes:', profileError);
        
        // Verificar se é problema de RLS
        if (profileError.code === '42501') {
          console.log('\n🛡️ Problema de RLS detectado!');
          console.log('💡 Solução: Usar Service Role Key ou desabilitar RLS temporariamente');
        }
      } else {
        console.log('✅ Perfil criado com sucesso!');
        console.log('📊 Dados do perfil:', profileData);
      }
    } else {
      console.log('✅ Usuário criado via auth!');
      console.log('👤 User ID:', authData.user?.id);
      console.log('📧 Email:', authData.user?.email);
      
      // Se o usuário foi criado, verificar se o perfil foi criado automaticamente
      if (authData.user) {
        console.log('\n🔍 Verificando se perfil foi criado automaticamente...');
        
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileCheckError) {
          console.log('❌ Perfil não foi criado automaticamente:', profileCheckError.message);
          
          // Tentar criar o perfil manualmente
          console.log('🔄 Criando perfil manualmente...');
          const { data: manualProfile, error: manualError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              full_name: 'Usuário Teste',
              subscription_status: 'active',
              subscription_type: 'annual',
              subscription_start_date: new Date().toISOString(),
              customer_id: 'cus_test_' + Date.now(),
              subscription_id: 'sub_test_' + Date.now(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (manualError) {
            console.log('❌ Erro ao criar perfil manualmente:', manualError.message);
          } else {
            console.log('✅ Perfil criado manualmente!');
            console.log('📊 Dados:', manualProfile);
          }
        } else {
          console.log('✅ Perfil encontrado!');
          console.log('📊 Status atual:', existingProfile.subscription_status);
          
          // Atualizar para ativo se não estiver
          if (existingProfile.subscription_status !== 'active') {
            console.log('🔄 Atualizando status para ativo...');
            const { data: updatedProfile, error: updateError } = await supabase
              .from('user_profiles')
              .update({
                subscription_status: 'active',
                subscription_type: 'annual',
                subscription_start_date: new Date().toISOString(),
                customer_id: 'cus_test_' + Date.now(),
                subscription_id: 'sub_test_' + Date.now(),
                updated_at: new Date().toISOString()
              })
              .eq('id', authData.user.id)
              .select()
              .single();
            
            if (updateError) {
              console.log('❌ Erro ao atualizar:', updateError.message);
            } else {
              console.log('✅ Perfil atualizado!');
              console.log('📊 Novo status:', updatedProfile.subscription_status);
            }
          }
        }
      }
    }
    
    // Verificar quantos usuários ativos temos agora
    console.log('\n📊 Verificando usuários ativos...');
    const { data: activeUsers, error: activeError } = await supabase
      .from('user_profiles')
      .select('email, subscription_status, subscription_type')
      .eq('subscription_status', 'active');
    
    if (activeError) {
      console.log('❌ Erro ao verificar usuários ativos:', activeError.message);
    } else {
      console.log(`✅ Total de usuários ativos: ${activeUsers?.length || 0}`);
      if (activeUsers && activeUsers.length > 0) {
        activeUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.subscription_type})`);
        });
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📋 RESUMO:');
    console.log('✅ Teste de criação de usuário concluído');
    console.log('💡 Agora você pode testar o login no frontend');
    console.log('🔑 Credenciais de teste:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Senha: ${testPassword}`);
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err.message);
  }
}

createTestUser();