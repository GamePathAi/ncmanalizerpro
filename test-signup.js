// Script simplificado para testar cadastro
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fsntzljufghutoyqxokm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTY0MDEsImV4cCI6MjA2OTE3MjQwMX0.MTkYFy_FfnGOiHrDVjV3AWDYao8YLQf1TnnBWeJwG-I'
)

async function testSignup() {
  console.log('🧪 Testando cadastro de usuário...')
  
  const testEmail = `teste${Date.now()}@exemplo.com`
  const testPassword = 'MinhaSenh@123'
  
  console.log(`📧 Email de teste: ${testEmail}`)
  
  try {
    // Tentar fazer cadastro
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (error) {
      console.error('❌ Erro no cadastro:')
      console.error('Mensagem:', error.message)
      console.error('Código:', error.status)
      console.error('Detalhes completos:', JSON.stringify(error, null, 2))
      return
    }
    
    console.log('✅ Cadastro realizado com sucesso!')
    console.log('ID do usuário:', data.user?.id)
    console.log('Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não')
    
    // Aguardar um pouco
    console.log('⏳ Aguardando 3 segundos...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Tentar buscar o perfil criado
    console.log('🔍 Verificando se perfil foi criado...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single()
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:')
      console.error('Mensagem:', profileError.message)
      console.error('Código:', profileError.code)
      console.error('Detalhes:', JSON.stringify(profileError, null, 2))
      return
    }
    
    console.log('✅ Perfil encontrado:')
    console.log(JSON.stringify(profile, null, 2))
    
  } catch (err) {
    console.error('❌ Erro inesperado:')
    console.error(err.message)
    console.error(err.stack)
  }
}

testSignup()