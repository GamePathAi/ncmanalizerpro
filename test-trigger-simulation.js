import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.error('→ Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY) no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTriggerSimulation() {
  console.log('🧪 Simulando o que o trigger deveria fazer...');
  
  try {
    // 1. Primeiro, vamos criar um usuário "fake" para simular o trigger
    const fakeUserId = crypto.randomUUID();
    const fakeEmail = `trigger-sim-${Date.now()}@test.com`;
    
    console.log(`📧 Simulando usuário: ${fakeEmail}`);
    console.log(`🆔 ID simulado: ${fakeUserId}`);
    
    // 2. Tentar inserir o perfil como o trigger faria
    console.log('\n1. Inserindo perfil como o trigger faria...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: fakeUserId,
        email: fakeEmail,
        full_name: null, // Como viria do auth.users sem metadados
        subscription_type: 'free',
        subscription_status: 'active',
        totp_enabled: false,
        totp_secret: null,
        totp_backup_codes: null
      })
      .select();
    
    if (profileError) {
      console.error('❌ Erro ao inserir perfil (simulação do trigger):', profileError.message);
      console.error('Código:', profileError.code);
      console.error('Detalhes:', profileError.details);
    } else {
      console.log('✅ Perfil inserido com sucesso (simulação)!');
      console.log('Dados:', profileData[0]);
    }
    
    // 3. Agora vamos tentar chamar a função handle_new_user diretamente
    console.log('\n2. Tentando chamar função handle_new_user...');
    
    try {
      const { data: funcResult, error: funcError } = await supabase.rpc('handle_new_user');
      
      if (funcError) {
        console.error('❌ Erro ao chamar handle_new_user:', funcError.message);
        console.error('Código:', funcError.code);
        console.error('Detalhes:', funcError.details);
      } else {
        console.log('✅ Função handle_new_user executada!');
        console.log('Resultado:', funcResult);
      }
    } catch (err) {
      console.error('❌ Erro ao executar função:', err.message);
    }
    
    // 4. Verificar se existem funções TOTP
    console.log('\n3. Verificando funções TOTP...');
    
    try {
      const { data: backupCodes, error: backupError } = await supabase.rpc('generate_totp_backup_codes');
      
      if (backupError) {
        console.error('❌ Função generate_totp_backup_codes não existe:', backupError.message);
      } else {
        console.log('✅ Função generate_totp_backup_codes existe!');
        console.log('Códigos gerados:', backupCodes?.length || 0);
      }
    } catch (err) {
      console.error('❌ Erro ao testar função TOTP:', err.message);
    }
    
    // 5. Tentar um cadastro real agora
    console.log('\n4. Tentando cadastro real após limpeza...');
    
    // Primeiro limpar o registro simulado
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', fakeUserId);
    
    console.log('🧹 Registro simulado removido');
    
    // Agora tentar cadastro real
    const realEmail = `real-test-${Date.now()}@test.com`;
    console.log(`📧 Tentando cadastro real: ${realEmail}`);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: realEmail,
      password: 'TestPassword123!'
    });
    
    if (signupError) {
      console.error('❌ Cadastro real falhou:', signupError.message);
      console.error('Código:', signupError.status);
      
      // Vamos tentar descobrir se o usuário foi criado no auth mas não no perfil
      console.log('\n5. Verificando se usuário foi criado no auth...');
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar perfis novamente
      const { data: allProfiles, error: allError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (allError) {
        console.error('❌ Erro ao verificar perfis:', allError.message);
      } else {
        console.log(`📊 Total de perfis após tentativa: ${allProfiles?.length || 0}`);
        if (allProfiles && allProfiles.length > 0) {
          console.log('📋 Perfis mais recentes:');
          allProfiles.slice(0, 3).forEach(profile => {
            console.log(`  - ${profile.email} (${profile.created_at})`);
          });
        }
      }
    } else {
      console.log('✅ Cadastro real funcionou!');
      console.log('ID:', signupData.user?.id);
      console.log('Email:', signupData.user?.email);
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    console.error('Stack:', err.stack);
  }
}

testTriggerSimulation();