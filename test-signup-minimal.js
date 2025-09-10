import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Tentar múltiplas convenções de variáveis (NEXT_PUBLIC_ / VITE_ / genéricas)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.error('→ Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY) no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMinimalSignup() {
  console.log('🧪 Testando cadastro mínimo (sem metadados)...');
  
  const testEmail = `minimal-${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';
  
  console.log(`📧 Email de teste: ${testEmail}`);
  
  try {
    // Cadastro mais simples possível
    console.log('1. Tentando cadastro básico...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.error('❌ Erro no cadastro básico:');
      console.error('Mensagem:', error.message);
      console.error('Código:', error.status);
      console.error('Tipo:', error.name);
      
      // Tentar cadastro ainda mais simples
      console.log('\n2. Tentando cadastro ultra-simples...');
      const { data: data2, error: error2 } = await supabase.auth.signUp({
        email: `ultra-${Date.now()}@test.com`,
        password: 'Simple123'
      });
      
      if (error2) {
        console.error('❌ Erro no cadastro ultra-simples:', error2.message);
        return;
      } else {
        console.log('✅ Cadastro ultra-simples funcionou!');
        console.log('ID:', data2.user?.id);
      }
      return;
    }
    
    console.log('✅ Cadastro básico funcionou!');
    console.log('ID do usuário:', data.user?.id);
    console.log('Email:', data.user?.email);
    
    // Aguardar trigger
    console.log('\n⏳ Aguardando 3 segundos para o trigger...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar se perfil foi criado
    console.log('\n3. Verificando se perfil foi criado...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();
    
    if (profileError) {
      console.error('❌ Perfil não foi criado:', profileError.message);
      
      // Verificar se há algum perfil na tabela
      console.log('\n4. Verificando todos os perfis na tabela...');
      const { data: allProfiles, error: allError } = await supabase
        .from('user_profiles')
        .select('*');
      
      if (allError) {
        console.error('❌ Erro ao buscar todos os perfis:', allError.message);
      } else {
        console.log(`📊 Total de perfis na tabela: ${allProfiles?.length || 0}`);
        if (allProfiles && allProfiles.length > 0) {
          console.log('📋 Perfis existentes:', allProfiles);
        }
      }
    } else {
      console.log('✅ Perfil criado com sucesso!');
      console.log('📋 Dados do perfil:');
      console.log('- ID:', profile.id);
      console.log('- Email:', profile.email);
      console.log('- Nome:', profile.full_name);
      console.log('- Tipo:', profile.subscription_type);
      console.log('- Status:', profile.subscription_status);
      console.log('- TOTP habilitado:', profile.totp_enabled);
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    console.error('Stack:', err.stack);
  }
}

testMinimalSignup();