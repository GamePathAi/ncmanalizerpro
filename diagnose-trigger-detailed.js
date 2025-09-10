import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function diagnoseTrigger() {
  console.log('🔍 Diagnóstico detalhado do trigger...');
  
  try {
    // 1. Testar inserção direta na tabela com UUID válido
    console.log('\n1. Testando inserção direta na tabela...');
    const testUserId = generateUUID();
    console.log('📝 Usando UUID:', testUserId);
    
    const { data: insertTest, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: 'test-direct@example.com',
        full_name: 'Test Direct Insert',
        subscription_type: 'free',
        subscription_status: 'active',
        totp_enabled: false
      })
      .select();
    
    if (insertError) {
      console.log('❌ Erro na inserção direta:', insertError);
    } else {
      console.log('✅ Inserção direta funcionou:', insertTest);
      
      // Limpar o teste
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId);
      
      if (deleteError) {
        console.log('⚠️ Erro ao limpar teste:', deleteError);
      } else {
        console.log('🧹 Registro de teste removido');
      }
    }
    
    // 2. Verificar se a tabela está acessível
    console.log('\n2. Verificando acesso à tabela user_profiles...');
    const { data: tableData, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Erro ao acessar tabela:', tableError);
    } else {
      console.log('✅ Tabela acessível. Registros encontrados:', tableData?.length || 0);
    }
    
    // 3. Testar cadastro de usuário real via auth
    console.log('\n3. Testando cadastro via Supabase Auth...');
    const testEmail = `teste-trigger-${Date.now()}@exemplo.com`;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'senha123456',
      options: {
        data: {
          full_name: 'Teste Trigger User'
        }
      }
    });
    
    if (authError) {
      console.log('❌ Erro no cadastro via auth:', authError);
    } else {
      console.log('✅ Cadastro via auth funcionou:', {
        user_id: authData.user?.id,
        email: authData.user?.email,
        confirmed: authData.user?.email_confirmed_at ? 'Sim' : 'Não'
      });
      
      // Aguardar um pouco para o trigger executar
      console.log('⏳ Aguardando trigger executar...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se o perfil foi criado
      if (authData.user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Perfil não foi criado pelo trigger:', profileError);
        } else {
          console.log('✅ Perfil criado pelo trigger:', profileData);
        }
      }
    }
    
    // 4. Verificar total de registros na tabela
    console.log('\n4. Verificando total de registros...');
    const { data: allProfiles, error: countError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, created_at');
    
    if (countError) {
      console.log('❌ Erro ao contar registros:', countError);
    } else {
      console.log('📊 Total de perfis na tabela:', allProfiles?.length || 0);
      if (allProfiles && allProfiles.length > 0) {
        console.log('👥 Perfis encontrados:');
        allProfiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.email} (${profile.full_name}) - ${profile.created_at}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

diagnoseTrigger();