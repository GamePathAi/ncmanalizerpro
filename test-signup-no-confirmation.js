import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testSignupWithoutConfirmation() {
  console.log('🧪 Testando cadastro sem confirmação de email...')
  
  const testEmail = `teste${Date.now()}@exemplo.com`
  const testPassword = 'MinhaSenh@123'
  
  try {
    console.log(`📧 Tentando cadastrar: ${testEmail}`)
    
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
      return
    }
    
    console.log('✅ Cadastro realizado com sucesso!')
    console.log('📊 Dados do usuário:', {
      id: data.user?.id,
      email: data.user?.email,
      email_confirmed_at: data.user?.email_confirmed_at,
      created_at: data.user?.created_at
    })
    
    // Verificar se o usuário foi confirmado automaticamente
    if (data.user?.email_confirmed_at) {
      console.log('🎉 EMAIL CONFIRMADO AUTOMATICAMENTE! Configuração funcionando.')
    } else {
      console.log('⚠️  Email ainda não confirmado. Pode precisar aguardar alguns segundos.')
      
      // Tentar fazer login imediatamente
      console.log('🔐 Testando login imediato...')
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      
      if (loginError) {
        console.error('❌ Erro no login:', loginError.message)
      } else {
        console.log('✅ Login realizado com sucesso!')
        console.log('📊 Status após login:', {
          email_confirmed_at: loginData.user?.email_confirmed_at,
          session_exists: !!loginData.session
        })
      }
    }
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err)
  }
}

// Executar o teste
testSignupWithoutConfirmation()
  .then(() => {
    console.log('\n🏁 Teste concluído!')
    process.exit(0)
  })
  .catch(err => {
    console.error('💥 Falha no teste:', err)
    process.exit(1)
  })