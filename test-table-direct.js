import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTableDirect() {
  console.log('🧪 Testando inserção direta na tabela user_profiles...');
  
  const testUserId = crypto.randomUUID();
  const testEmail = `test-direct-${Date.now()}@example.com`;
  
  try {
    // 1. Testar inserção direta
    console.log('1. Testando inserção direta...');
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        full_name: 'Teste Direto',
        subscription_type: 'free',
        subscription_status: 'active',
        totp_secret: null,
        totp_enabled: false,
        totp_backup_codes: null
      })
      .select();
    
    if (insertError) {
      console.log('❌ Erro na inserção direta:', insertError.message);
      console.log('📋 Detalhes:', insertError);
    } else {
      console.log('✅ Inserção direta funcionou:', insertData);
      
      // Limpar teste
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId);
      
      console.log('🧹 Registro de teste removido');
    }
    
    // 2. Verificar total de registros
    console.log('\n2. Verificando total de registros...');
    const { data: allData, error: selectError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' });
    
    if (selectError) {
      console.log('❌ Erro ao consultar tabela:', selectError.message);
    } else {
      console.log(`📊 Total de registros na tabela: ${allData?.length || 0}`);
      if (allData && allData.length > 0) {
        console.log('📋 Registros existentes:', allData);
      }
    }
    
    // 3. Testar se conseguimos criar um usuário simples via auth
    console.log('\n3. Testando cadastro simples via auth (sem metadata)...');
    const simpleEmail = `simple-${Date.now()}@example.com`;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: simpleEmail,
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.log('❌ Erro no cadastro simples:', authError.message);
      console.log('📋 Código:', authError.status);
    } else {
      console.log('✅ Cadastro simples funcionou:', authData.user?.id);
      
      // Aguardar trigger
      console.log('⏳ Aguardando trigger...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se perfil foi criado
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', simpleEmail);
      
      if (profileData && profileData.length > 0) {
        console.log('✅ Trigger funcionou! Perfil criado:', profileData[0]);
      } else {
        console.log('❌ Trigger não funcionou - perfil não foi criado');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testTableDirect();