import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDatabaseObjects() {
  try {
    console.log('🔍 Verificando objetos do banco de dados...')
    
    // Verificar tabela user_profiles
    console.log('\n1️⃣ Verificando tabela user_profiles...')
    const { data: tableData, error: tableError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true })
    
    if (tableError) {
      console.error('❌ Tabela user_profiles não existe ou não é acessível:', tableError.message)
    } else {
      console.log('✅ Tabela user_profiles existe e é acessível')
    }
    
    // Verificar função handle_new_user usando uma query SQL
    console.log('\n2️⃣ Verificando função handle_new_user...')
    const { data: functionData, error: functionError } = await supabase
      .rpc('handle_new_user')
    
    if (functionError) {
      console.log('❌ Função handle_new_user não existe ou não é acessível')
      console.log('Erro:', functionError.message)
    } else {
      console.log('✅ Função handle_new_user existe')
    }
    
    // Verificar se conseguimos fazer uma query básica na tabela
    console.log('\n3️⃣ Testando acesso à tabela user_profiles...')
    const { data: selectData, error: selectError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.error('❌ Erro ao acessar user_profiles:', selectError.message)
      console.log('🔧 Possível problema de RLS (Row Level Security)')
    } else {
      console.log('✅ Acesso à tabela user_profiles OK')
      console.log('📊 Registros encontrados:', selectData?.length || 0)
    }
    
    // Verificar políticas RLS
    console.log('\n4️⃣ Testando inserção na tabela (simulando trigger)...')
    
    // Tentar inserir um registro de teste diretamente
    const testId = crypto.randomUUID()
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testId,
        email: 'teste@exemplo.com',
        full_name: 'Teste Manual'
      })
      .select()
    
    if (insertError) {
      console.error('❌ Erro ao inserir na user_profiles:', insertError.message)
      console.log('🔧 Isso pode indicar problema nas políticas RLS')
    } else {
      console.log('✅ Inserção manual na user_profiles OK')
      
      // Limpar o registro de teste
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testId)
      
      console.log('🧹 Registro de teste removido')
    }
    
    console.log('\n📋 RESUMO DA VERIFICAÇÃO:')
    console.log('- Tabela user_profiles:', tableError ? '❌' : '✅')
    console.log('- Acesso à tabela:', selectError ? '❌' : '✅')
    console.log('- Inserção manual:', insertError ? '❌' : '✅')
    
    if (tableError || selectError || insertError) {
      console.log('\n🚨 PROBLEMAS ENCONTRADOS!')
      console.log('\n🔧 SOLUÇÕES RECOMENDADAS:')
      console.log('1. Verifique se o script fix-database-schema.sql foi executado no Supabase Dashboard')
      console.log('2. Verifique as políticas RLS na tabela user_profiles')
      console.log('3. Verifique se a função handle_new_user foi criada corretamente')
      console.log('4. Verifique se o trigger on_auth_user_created foi criado')
      console.log('\n📖 Para executar o script:')
      console.log('- Acesse o Supabase Dashboard')
      console.log('- Vá em SQL Editor')
      console.log('- Cole o conteúdo do arquivo fix-database-schema.sql')
      console.log('- Execute o script')
    } else {
      console.log('\n🎉 Todos os objetos estão funcionando corretamente!')
      console.log('\n🤔 O problema pode estar no trigger ou na função handle_new_user')
      console.log('Verifique os logs do Supabase Dashboard para mais detalhes.')
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

verifyDatabaseObjects()