// Script para testar conexão e cadastro no Supabase
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fsntzljufghutoyqxokm.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTY0MDEsImV4cCI6MjA2OTE3MjQwMX0.MTkYFy_FfnGOiHrDVjV3AWDYao8YLQf1TnnBWeJwG-I'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey.substring(0, 20) + '...')
  
  try {
    // Testar conexão básica
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact' })
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
      return false
    }
    
    console.log('✅ Conexão estabelecida com sucesso!')
    console.log('📊 Registros na tabela user_profiles:', data)
    return true
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message)
    return false
  }
}

async function testTableStructure() {
  console.log('\n🔍 Verificando estrutura da tabela user_profiles...')
  
  try {
    // Tentar fazer uma consulta simples para verificar se a tabela existe
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao acessar tabela user_profiles:', error.message)
      console.error('💡 Possível causa: Tabela não existe ou políticas RLS bloqueando acesso')
      return false
    }
    
    console.log('✅ Tabela user_profiles acessível!')
    if (data && data.length > 0) {
      console.log('📋 Exemplo de registro:', data[0])
    } else {
      console.log('📋 Tabela vazia (normal para novo projeto)')
    }
    return true
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message)
    return false
  }
}

async function testSignUp() {
  console.log('\n🔍 Testando processo de cadastro...')
  
  const testEmail = `test${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  try {
    console.log('📧 Tentando cadastrar:', testEmail)
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Teste'
        }
      }
    })
    
    if (error) {
      console.error('❌ Erro no cadastro:', error.message)
      console.error('🔍 Detalhes do erro:', error)
      return false
    }
    
    console.log('✅ Cadastro realizado com sucesso!')
    console.log('👤 Usuário criado:', data.user?.id)
    console.log('📧 Email:', data.user?.email)
    
    // Aguardar um pouco para o trigger criar o perfil
    console.log('⏳ Aguardando criação do perfil...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Verificar se o perfil foi criado
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single()
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil criado:', profileError.message)
      console.error('💡 Possível causa: Trigger não funcionou ou políticas RLS bloqueando')
      return false
    }
    
    console.log('✅ Perfil criado automaticamente!')
    console.log('📋 Dados do perfil:', profile)
    
    return true
  } catch (err) {
    console.error('❌ Erro inesperado no cadastro:', err.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes do Supabase...\n')
  
  const connectionOk = await testConnection()
  if (!connectionOk) {
    console.log('\n❌ Falha na conexão. Verifique as credenciais do Supabase.')
    return
  }
  
  const tableOk = await testTableStructure()
  if (!tableOk) {
    console.log('\n❌ Problema com a tabela user_profiles. Execute o script simple_schema.sql no Supabase.')
    return
  }
  
  const signupOk = await testSignUp()
  if (!signupOk) {
    console.log('\n❌ Problema no processo de cadastro. Verifique triggers e políticas RLS.')
    return
  }
  
  console.log('\n🎉 Todos os testes passaram! O Supabase está configurado corretamente.')
}

// Executar testes
runTests().catch(console.error)