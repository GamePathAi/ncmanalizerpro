import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testando conexão com Supabase...')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n🔗 Testando conectividade básica...')
    
    // Teste 1: Verificar se consegue fazer uma query simples
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.log('⚠️  Erro na query (esperado se tabela não existir):', error.message)
    } else {
      console.log('✅ Conexão com banco funcionando!')
    }
    
    // Teste 2: Verificar auth
    console.log('\n🔐 Testando autenticação...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('❌ Erro na autenticação:', authError.message)
    } else {
      console.log('✅ Sistema de autenticação respondendo!')
    }
    
    // Teste 3: Tentar signup com email temporário
    console.log('\n📧 Testando signup...')
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })
    
    if (signupError) {
      console.log('❌ Erro no signup:', signupError.message)
      console.log('Código do erro:', signupError.status)
      console.log('Detalhes:', signupError)
    } else {
      console.log('✅ Signup funcionando!')
      console.log('User ID:', signupData.user?.id)
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error)
    
    if (error.message.includes('fetch')) {
      console.log('\n🚨 DIAGNÓSTICO: Erro de "Failed to fetch"')
      console.log('Possíveis causas:')
      console.log('1. Problema de rede/conectividade')
      console.log('2. URL do Supabase incorreta')
      console.log('3. Firewall/proxy bloqueando')
      console.log('4. Supabase fora do ar')
      console.log('\n🔧 Soluções:')
      console.log('- Verificar conexão com internet')
      console.log('- Testar URL no navegador:', supabaseUrl)
      console.log('- Verificar se não há proxy/VPN interferindo')
    }
  }
}

testConnection()