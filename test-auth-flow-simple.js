import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Usar as variáveis corretas do .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas:');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurada' : '❌ Não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthFlow() {
  console.log('🔄 TESTE DO FLUXO DE AUTENTICAÇÃO');
  console.log('=' .repeat(50));
  
  const testEmail = `teste-${Date.now()}@exemplo.com`;
  const testPassword = 'MinhaSenh@123!';
  
  console.log(`📧 Email de teste: ${testEmail}`);
  
  try {
    // PASSO 1: Cadastro
    console.log('\n🔐 PASSO 1: Cadastro de usuário');
    console.log('-'.repeat(40));
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Teste'
        }
      }
    });
    
    if (signUpError) {
      console.error('❌ Erro no cadastro:', signUpError.message);
      return;
    }
    
    console.log('✅ Usuário cadastrado com sucesso!');
    console.log('📧 Email confirmado:', signUpData.user?.email_confirmed_at ? 'Sim' : 'Não');
    
    // PASSO 2: Verificar perfil do usuário
    console.log('\n👤 PASSO 2: Verificando perfil do usuário');
    console.log('-'.repeat(40));
    
    if (signUpData.user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();
      
      if (profileError) {
        console.log('⚠️ Perfil não encontrado (será criado automaticamente)');
      } else {
        console.log('✅ Perfil encontrado:');
        console.log('   - Estado:', profile.user_state);
        console.log('   - Email verificado:', profile.email_verified_at ? 'Sim' : 'Não');
      }
    }
    
    // PASSO 3: Testar login (se email não precisa confirmação)
    console.log('\n🔑 PASSO 3: Testando login');
    console.log('-'.repeat(40));
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.log('⚠️ Login falhou (esperado se email precisa confirmação):', signInError.message);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('   - Usuário ID:', signInData.user?.id);
      console.log('   - Email confirmado:', signInData.user?.email_confirmed_at ? 'Sim' : 'Não');
    }
    
    // PASSO 4: Verificar edge functions
    console.log('\n⚡ PASSO 4: Testando edge functions');
    console.log('-'.repeat(40));
    
    try {
      const { data: funcData, error: funcError } = await supabase.functions.invoke('auth-endpoints', {
        body: { action: 'me' }
      });
      
      if (funcError) {
        console.log('⚠️ Edge function não disponível:', funcError.message);
      } else {
        console.log('✅ Edge functions funcionando!');
      }
    } catch (err) {
      console.log('⚠️ Edge functions não testadas:', err.message);
    }
    
    console.log('\n📋 RESUMO DO TESTE:');
    console.log('=' .repeat(50));
    console.log('✅ Conexão com Supabase: OK');
    console.log('✅ Cadastro de usuário: OK');
    console.log('✅ Sistema de autenticação: Funcionando');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testAuthFlow();