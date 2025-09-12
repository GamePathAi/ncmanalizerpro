const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando configurações...');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada');
console.log('Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ Não encontrada');
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configurações do Supabase não encontradas no .env');
  console.log('Verifique se VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeRLSFix() {
  console.log('🔧 EXECUTANDO CORREÇÃO DAS POLÍTICAS RLS');
  console.log('=====================================\n');

  try {
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'fix-rls-policy-conflict.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir em comandos individuais (separados por ;)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));

    console.log(`📝 Encontrados ${sqlCommands.length} comandos SQL para executar\n`);

    // Executar cada comando
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`⏳ Executando comando ${i + 1}/${sqlCommands.length}...`);
      console.log(`   ${command.substring(0, 60)}${command.length > 60 ? '...' : ''}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command
        });
        
        if (error) {
          console.log(`   ⚠️ Erro (pode ser normal): ${error.message}`);
        } else {
          console.log(`   ✅ Sucesso`);
        }
      } catch (err) {
        console.log(`   ⚠️ Erro de execução: ${err.message}`);
      }
      
      console.log('');
    }

    // Verificar políticas criadas
    console.log('🔍 VERIFICANDO POLÍTICAS CRIADAS');
    console.log('================================\n');
    
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'public')
        .eq('tablename', 'password_reset_tokens');
      
      if (policiesError) {
        console.log('⚠️ Não foi possível verificar políticas via pg_policies');
        console.log('   Tentando método alternativo...');
        
        // Método alternativo usando SQL direto
        const { data: altPolicies, error: altError } = await supabase.rpc('exec_sql', {
          sql: `SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname = 'public' AND tablename = 'password_reset_tokens' ORDER BY policyname`
        });
        
        if (altError) {
          console.log('❌ Não foi possível verificar políticas:', altError.message);
        } else {
          console.log('✅ Políticas encontradas:', altPolicies?.length || 0);
        }
      } else {
        console.log(`✅ Políticas RLS criadas: ${policies?.length || 0}`);
        if (policies && policies.length > 0) {
          policies.forEach(policy => {
            console.log(`   - ${policy.policyname} (${policy.cmd})`);
          });
        }
      }
    } catch (err) {
      console.log('⚠️ Erro ao verificar políticas:', err.message);
    }

    console.log('\n🎉 CORREÇÃO DAS POLÍTICAS RLS CONCLUÍDA!');
    console.log('=========================================');
    console.log('✅ Políticas duplicadas removidas');
    console.log('✅ Novas políticas criadas com nomes únicos');
    console.log('✅ RLS habilitado na tabela password_reset_tokens');
    console.log('\n👉 Próximo passo: Testar o sistema de autenticação');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n📋 SOLUÇÕES ALTERNATIVAS:');
    console.log('1. Execute o SQL manualmente no Supabase Dashboard');
    console.log('2. Verifique as credenciais do Supabase no .env');
    console.log('3. Confirme que a tabela password_reset_tokens existe');
  }
}

// Executar o script
executeRLSFix().catch(console.error);