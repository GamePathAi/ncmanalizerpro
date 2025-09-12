const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://fsntzljufghutoyqxokm.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTY0MDEsImV4cCI6MjA2OTE3MjQwMX0.MTkYFy_FfnGOiHrDVjV3AWDYao8YLQf1TnnBWeJwG-I';

const supabase = createClient(supabaseUrl, anonKey);

async function verificarEstadoFinal() {
  console.log('🔍 VERIFICAÇÃO FINAL DO BANCO DE DADOS');
  console.log('=====================================\n');
  
  try {
    // 1. Verificar se a tabela password_reset_tokens existe
    console.log('1️⃣ Verificando tabela password_reset_tokens...');
    
    const { data: tokenTest, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('count')
      .limit(1);
    
    if (tokenError) {
      if (tokenError.message.includes('does not exist') || tokenError.message.includes('schema cache')) {
        console.log('❌ Tabela password_reset_tokens NÃO EXISTE');
        console.log('   👉 Execute o SQL manual no Supabase Dashboard');
      } else {
        console.log('⚠️ Erro ao acessar tabela:', tokenError.message);
      }
    } else {
      console.log('✅ Tabela password_reset_tokens EXISTE e está acessível');
    }
    
    // 2. Listar todas as tabelas públicas
    console.log('\n2️⃣ Listando todas as tabelas públicas...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (tablesError) {
      console.log('❌ Não foi possível listar tabelas:', tablesError.message);
    } else if (tables && tables.length > 0) {
      console.log('✅ Tabelas encontradas:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('⚠️ Nenhuma tabela pública encontrada');
    }
    
    // 3. Verificar tabelas de autenticação
    console.log('\n3️⃣ Verificando sistema de autenticação...');
    
    const { data: authTest, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Erro no sistema de auth:', authError.message);
    } else {
      console.log('✅ Sistema de autenticação está funcionando');
    }
    
    // 4. Verificar se há usuários
    console.log('\n4️⃣ Verificando usuários existentes...');
    
    try {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.log('⚠️ Não foi possível listar usuários (normal com chave anon):', usersError.message);
      } else {
        console.log(`✅ Sistema de usuários funcionando. Total: ${users.users?.length || 0}`);
      }
    } catch (userErr) {
      console.log('⚠️ Acesso limitado aos usuários (esperado com chave anon)');
    }
    
    // 5. Testar função de recuperação de senha
    console.log('\n5️⃣ Testando função de recuperação de senha...');
    
    const testEmail = 'teste@exemplo.com';
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:5173/reset-password'
    });
    
    if (resetError) {
      console.log('❌ Erro ao testar recuperação:', resetError.message);
    } else {
      console.log('✅ Função de recuperação de senha está funcionando');
      console.log('   (Email de teste não será enviado para email inexistente)');
    }
    
    // 6. Resumo final
    console.log('\n📊 RESUMO FINAL');
    console.log('================');
    
    const checks = [
      { name: 'Tabela password_reset_tokens', status: !tokenError },
      { name: 'Listagem de tabelas', status: !tablesError },
      { name: 'Sistema de autenticação', status: !authError },
      { name: 'Função de reset de senha', status: !resetError }
    ];
    
    checks.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
    });
    
    const allGood = checks.every(check => check.status);
    
    if (allGood) {
      console.log('\n🎉 TUDO FUNCIONANDO PERFEITAMENTE!');
      console.log('   O sistema de recuperação de senha está pronto para uso.');
    } else {
      console.log('\n⚠️ ALGUNS PROBLEMAS ENCONTRADOS');
      console.log('   Consulte o arquivo GUIA_EXECUCAO_MANUAL_SUPABASE.md');
    }
    
  } catch (error) {
    console.error('❌ Erro geral na verificação:', error.message);
    
    console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
    console.log('1. Verifique se as chaves API estão corretas no .env');
    console.log('2. Confirme se está no projeto Supabase correto');
    console.log('3. Execute o SQL manual no Supabase Dashboard');
    console.log('4. Verifique se o projeto tem autenticação habilitada');
  }
}

verificarEstadoFinal();