import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Testando configuração básica do Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key (primeiros 20 chars):', supabaseKey?.substring(0, 20) + '...')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testBasicConnection() {
  try {
    console.log('\n🧪 Testando conexão básica...')
    
    // Teste 1: Verificar se consegue conectar
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
      return false
    }
    
    console.log('✅ Conexão com Supabase OK')
    console.log('📊 Tabela user_profiles existe e tem', data?.length || 0, 'registros')
    
    // Teste 2: Verificar auth
    console.log('\n🔐 Testando configuração de autenticação...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Erro na configuração de auth:', authError.message)
      return false
    }
    
    console.log('✅ Configuração de auth OK')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
    return false
  }
}

testBasicConnection().then(success => {
  if (success) {
    console.log('\n🎉 Configuração básica do Supabase está funcionando!')
  } else {
    console.log('\n💥 Há problemas na configuração do Supabase')
  }
})