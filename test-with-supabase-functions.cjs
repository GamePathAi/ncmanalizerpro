const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY; // Usando anon key por enquanto

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Encontradas:');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.log('\n💡 Nota: Usando ANON_KEY para testes básicos');
  if (!supabaseUrl) process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFunction(functionName, params = []) {
  try {
    console.log(`\n🔧 Executando função: ${functionName}`);
    
    const { data, error } = await supabase.rpc(functionName, ...params);
    
    if (error) {
      console.error(`❌ Erro ao executar ${functionName}:`, error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error(`❌ Erro na execução de ${functionName}:`, err.message);
    return null;
  }
}

async function createFunctions() {
  console.log('📝 Criando funções SQL no Supabase...');
  
  try {
    // Ler o arquivo SQL
    const fs = require('fs');
    const sqlContent = fs.readFileSync('./create-auth-function.sql', 'utf8');
    
    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.includes('CREATE OR REPLACE FUNCTION')) {
        console.log(`\n⚡ Executando comando ${i + 1}/${commands.length}`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error);
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      }
    }
    
  } catch (err) {
    console.log('⚠️  Não foi possível executar SQL diretamente. Tentando método alternativo...');
    console.log('💡 Execute manualmente o arquivo create-auth-function.sql no Supabase Dashboard');
  }
}

async function testSystemConfiguration() {
  console.log('\n🔍 VERIFICANDO CONFIGURAÇÃO DO SISTEMA');
  console.log('=' .repeat(50));
  
  const configData = await executeSQLFunction('check_system_config');
  
  if (configData) {
    configData.forEach(config => {
      console.log(`\n📊 ${config.config_name.toUpperCase()}:`);
      console.log(`Status: ${config.status}`);
      console.log('Detalhes:', JSON.stringify(config.value, null, 2));
    });
  } else {
    console.log('❌ Não foi possível verificar configuração do sistema');
  }
}

async function testAuthenticationSystem() {
  console.log('\n🧪 TESTANDO SISTEMA DE AUTENTICAÇÃO');
  console.log('=' .repeat(50));
  
  const testData = await executeSQLFunction('test_auth_system');
  
  if (testData) {
    console.log('\n📋 RESULTADOS DO TESTE:');
    
    testData.forEach((step, index) => {
      const statusIcon = step.status === 'sucesso' ? '✅' : 
                        step.status === 'manual' ? '🔧' : 
                        step.status === 'falha' ? '❌' : '⚠️';
      
      console.log(`\n${index + 1}. ${statusIcon} ${step.step_name.toUpperCase()}`);
      console.log(`   Status: ${step.status}`);
      
      if (step.details) {
        const details = typeof step.details === 'string' ? 
          JSON.parse(step.details) : step.details;
        
        Object.entries(details).forEach(([key, value]) => {
          console.log(`   ${key}: ${JSON.stringify(value)}`);
        });
      }
    });
    
    // Verificar se o teste foi bem-sucedido
    const hasErrors = testData.some(step => step.status === 'falha');
    const isComplete = testData.some(step => 
      step.step_name === 'limpeza' && step.status === 'sucesso'
    );
    
    console.log('\n' + '='.repeat(50));
    if (hasErrors) {
      console.log('❌ TESTE FALHOU - Há erros no sistema');
    } else if (isComplete) {
      console.log('✅ TESTE COMPLETO - Sistema funcionando corretamente!');
      console.log('🎉 Fluxo de autenticação validado com sucesso!');
    } else {
      console.log('⚠️  TESTE INCOMPLETO - Verificar logs acima');
    }
    
  } else {
    console.log('❌ Não foi possível executar teste do sistema de autenticação');
  }
}

async function testDirectDatabaseAccess() {
  console.log('\n🔌 TESTANDO ACESSO DIRETO AO BANCO');
  console.log('=' .repeat(50));
  
  try {
    // Testar consulta simples
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (tablesError) {
      console.log('❌ Erro ao acessar information_schema:', tablesError.message);
    } else {
      console.log('✅ Acesso ao banco funcionando');
      console.log('📋 Tabelas encontradas:', tables?.map(t => t.table_name) || []);
    }
    
    // Testar acesso à tabela user_profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Erro ao acessar user_profiles:', profilesError.message);
    } else {
      console.log('✅ Tabela user_profiles acessível');
      console.log('📊 Total de perfis:', profiles?.length || 0);
    }
    
  } catch (err) {
    console.error('❌ Erro no teste de acesso:', err.message);
  }
}

async function main() {
  console.log('🚀 INICIANDO TESTES COM FUNÇÕES SUPABASE');
  console.log('=' .repeat(60));
  
  console.log('\n📋 Configuração:');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Service Key: ${supabaseServiceKey ? '✅ Configurada' : '❌ Não encontrada'}`);
  
  // 1. Testar acesso básico
  await testDirectDatabaseAccess();
  
  // 2. Tentar criar funções (pode falhar, mas não é crítico)
  await createFunctions();
  
  // 3. Verificar configuração do sistema
  await testSystemConfiguration();
  
  // 4. Testar sistema de autenticação
  await testAuthenticationSystem();
  
  console.log('\n🏁 TESTES CONCLUÍDOS');
  console.log('=' .repeat(60));
  
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. Se as funções não foram criadas automaticamente:');
  console.log('   - Acesse o Supabase Dashboard');
  console.log('   - Vá em Database > Functions');
  console.log('   - Execute o conteúdo de create-auth-function.sql');
  console.log('\n2. Se o teste passou:');
  console.log('   - Sistema de autenticação está funcionando!');
  console.log('   - Problema é apenas na configuração SMTP');
  console.log('\n3. Se o teste falhou:');
  console.log('   - Verificar estrutura das tabelas');
  console.log('   - Verificar triggers e funções');
}

// Executar testes
main().catch(console.error);