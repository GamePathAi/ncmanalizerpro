import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testFreshTOTPSetup() {
  console.log('🧪 Testando nova implementação TOTP...');
  
  try {
    // 1. Testar cadastro de usuário
    console.log('\n1. 🔐 Testando cadastro de usuário...');
    
    const testEmail = `totp-test-${Date.now()}@exemplo.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário TOTP Teste'
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Erro no cadastro:', signUpError.message);
      return;
    }
    
    console.log('✅ Usuário cadastrado com sucesso!');
    console.log('📧 Email:', testEmail);
    console.log('🆔 ID:', signUpData.user?.id);
    
    // 2. Verificar se perfil foi criado automaticamente
    console.log('\n2. 👤 Verificando criação automática do perfil...');
    
    if (signUpData.user?.id) {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Erro ao buscar perfil:', profileError.message);
      } else if (profileData) {
        console.log('✅ Perfil criado automaticamente!');
        console.log('📄 Dados do perfil:');
        console.log('  - Email:', profileData.email);
        console.log('  - Nome:', profileData.full_name);
        console.log('  - TOTP habilitado:', profileData.totp_enabled);
        console.log('  - Tipo de assinatura:', profileData.subscription_type);
      } else {
        console.log('❌ Perfil não encontrado');
      }
    }
    
    // 3. Testar funções TOTP
    console.log('\n3. 🔑 Testando funções TOTP...');
    
    // Testar geração de códigos de backup
    const { data: backupCodes, error: backupError } = await supabase
      .rpc('generate_totp_backup_codes');
    
    if (backupError) {
      console.log('❌ Erro ao gerar códigos de backup:', backupError.message);
    } else {
      console.log('✅ Códigos de backup gerados!');
      console.log('📋 Quantidade de códigos:', backupCodes?.length || 0);
      if (backupCodes && backupCodes.length > 0) {
        console.log('🔢 Exemplo de código:', backupCodes[0]);
      }
    }
    
    // 4. Testar auth hook (verificar token)
    console.log('\n4. 🎫 Testando auth hook no token...');
    
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      console.log('✅ Sessão ativa encontrada!');
      
      // Verificar claims personalizados no token
      const token = sessionData.session.access_token;
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      console.log('🔍 Claims no token:');
      console.log('  - full_name:', payload.full_name || 'não encontrado');
      console.log('  - subscription_type:', payload.subscription_type || 'não encontrado');
      console.log('  - subscription_status:', payload.subscription_status || 'não encontrado');
      console.log('  - totp_enabled:', payload.totp_enabled || 'não encontrado');
      
      if (payload.full_name || payload.subscription_type || payload.totp_enabled !== undefined) {
        console.log('✅ Auth hook funcionando - claims personalizados encontrados!');
      } else {
        console.log('⚠️ Auth hook pode não estar configurado - claims personalizados não encontrados');
        console.log('💡 Configure o auth hook no Supabase Dashboard: Authentication > Hooks');
      }
    } else {
      console.log('❌ Nenhuma sessão ativa encontrada');
    }
    
    // 5. Simular configuração TOTP
    console.log('\n5. ⚙️ Simulando configuração TOTP...');
    
    if (signUpData.user?.id) {
      const mockTOTPSecret = 'JBSWY3DPEHPK3PXP'; // Secret de exemplo
      const mockBackupCodes = ['12345678', '87654321', '11111111'];
      
      const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          totp_secret: mockTOTPSecret,
          totp_enabled: true,
          totp_backup_codes: mockBackupCodes,
          updated_at: new Date().toISOString()
        })
        .eq('id', signUpData.user.id)
        .select();
      
      if (updateError) {
        console.log('❌ Erro ao atualizar TOTP:', updateError.message);
      } else {
        console.log('✅ TOTP configurado com sucesso!');
        console.log('🔐 Secret configurado:', mockTOTPSecret);
        console.log('📋 Códigos de backup:', mockBackupCodes.length, 'códigos');
      }
      
      // Testar validação de código de backup
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_backup_code', {
          user_id: signUpData.user.id,
          backup_code: '12345678'
        });
      
      if (validationError) {
        console.log('❌ Erro ao validar código de backup:', validationError.message);
      } else {
        console.log('✅ Validação de código de backup:', validationResult ? 'VÁLIDO' : 'INVÁLIDO');
      }
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Se o auth hook não estiver funcionando, configure-o no Supabase Dashboard');
    console.log('2. Teste o componente TOTPSetup.tsx na aplicação');
    console.log('3. Verifique se o fluxo completo de TOTP funciona na interface');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testFreshTOTPSetup();