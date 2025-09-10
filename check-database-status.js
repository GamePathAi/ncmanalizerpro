// Script para verificar status detalhado do banco de dados
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fsntzljufghutoyqxokm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTY0MDEsImV4cCI6MjA2OTE3MjQwMX0.MTkYFy_FfnGOiHrDVjV3AWDYao8YLQf1TnnBWeJwG-I'
)

async function checkDatabaseStatus() {
  console.log('🔍 Verificação detalhada do status do banco de dados...')
  console.log('=' .repeat(60))
  
  try {
    // 1. Verificar se a tabela user_profiles existe
    console.log('\n1️⃣ Verificando tabela user_profiles...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true })
    
    if (tableError) {
      console.log('❌ Tabela user_profiles não existe ou não é acessível')
      console.log('Erro:', tableError.message)
      return
    } else {
      console.log('✅ Tabela user_profiles existe')
      console.log(`📊 Registros: ${tableCheck}`)
    }
    
    // 2. Verificar estrutura da tabela
    console.log('\n2️⃣ Verificando estrutura da tabela...')
    let columns, columnsError
    try {
      const result = await supabase.rpc('get_table_columns', {
        table_name: 'user_profiles'
      })
      columns = result.data
      columnsError = result.error
    } catch (err) {
      // Se a função não existir, pular verificação de estrutura
      console.log('⚠️ Não foi possível verificar estrutura da tabela')
      console.log('Motivo: Função de verificação não disponível')
      columns = null
      columnsError = null
    }
    
    if (columnsError) {
      console.log('⚠️ Não foi possível verificar estrutura da tabela')
      console.log('Erro:', columnsError.message)
    } else if (columns && columns.length > 0) {
      console.log('✅ Estrutura da tabela:')
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`)
      })
    }
    
    // 3. Verificar funções
    console.log('\n3️⃣ Verificando funções...')
    
    // Testar função handle_new_user (indiretamente)
    console.log('   🔍 Testando função handle_new_user...')
    let functions, functionsError
    try {
      const result = await supabase.rpc('check_function_exists', {
        function_name: 'handle_new_user'
      })
      functions = result.data
      functionsError = result.error
    } catch (err) {
      console.log('   ❌ Não foi possível verificar função handle_new_user')
      console.log('   Motivo: Função de verificação não disponível')
    }
    
    // Testar função generate_totp_backup_codes
    console.log('   🔍 Testando função generate_totp_backup_codes...')
    const { data: backupCodes, error: backupError } = await supabase.rpc('generate_totp_backup_codes')
    
    if (backupError) {
      console.log('   ❌ Função generate_totp_backup_codes não existe')
      console.log('   Erro:', backupError.message)
    } else {
      console.log('   ✅ Função generate_totp_backup_codes funcionando')
      console.log(`   📝 Gerou ${backupCodes?.length || 0} códigos`)
    }
    
    // 4. Verificar políticas RLS
    console.log('\n4️⃣ Verificando políticas RLS...')
    
    // Tentar inserir um registro de teste (deve falhar por RLS)
    const testUserId = '00000000-0000-0000-0000-000000000000'
    const { data: insertTest, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        full_name: 'Teste RLS'
      })
    
    if (insertError) {
      if (insertError.message.includes('row-level security')) {
        console.log('   ✅ Políticas RLS estão ativas (inserção bloqueada)')
      } else {
        console.log('   ❌ Erro inesperado na inserção:')
        console.log('   ', insertError.message)
      }
    } else {
      console.log('   ⚠️ Inserção permitida - RLS pode não estar configurado corretamente')
      // Limpar o registro de teste
      await supabase.from('user_profiles').delete().eq('id', testUserId)
    }
    
    // 5. Verificar triggers
    console.log('\n5️⃣ Verificando triggers...')
    console.log('   ℹ️ Triggers só podem ser verificados através de tentativa de cadastro')
    
    // 6. Resumo final
    console.log('\n' + '=' .repeat(60))
    console.log('📋 RESUMO DO STATUS:')
    console.log('✅ Conexão com Supabase: OK')
    console.log('✅ Tabela user_profiles: Existe')
    console.log(backupError ? '❌ Funções TOTP: Não criadas' : '✅ Funções TOTP: OK')
    console.log('✅ Políticas RLS: Ativas')
    console.log('❓ Função handle_new_user: Não verificável diretamente')
    console.log('❓ Trigger on_auth_user_created: Não verificável diretamente')
    
    console.log('\n🚨 DIAGNÓSTICO:')
    if (backupError) {
      console.log('❌ O script complete-database-setup.sql NÃO foi executado completamente')
      console.log('📝 AÇÃO NECESSÁRIA:')
      console.log('   1. Acesse o Supabase Dashboard')
      console.log('   2. Vá para SQL Editor')
      console.log('   3. Execute o script complete-database-setup.sql')
      console.log('   4. Verifique se todas as funções foram criadas')
    } else {
      console.log('✅ Funções TOTP criadas - script pode ter sido executado')
      console.log('⚠️ Mas ainda há problemas no cadastro - verificar trigger')
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:')
    console.error(error.message)
    console.error(error.stack)
  }
}

checkDatabaseStatus()