const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Usar URLs locais do Supabase com service role
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestUser() {
  console.log('👤 Criando usuário de teste...')
  
  const testEmail = 'test@example.com'
  const testPassword = 'senha123!'
  
  try {
    // Criar usuário usando admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Confirmar email automaticamente
    })
    
    if (error) {
      console.log('❌ Erro ao criar usuário:', error.message)
      return
    }
    
    console.log('✅ Usuário criado com sucesso!')
    console.log('📧 Email:', testEmail)
    console.log('🔑 Senha:', testPassword)
    console.log('🆔 User ID:', data.user?.id)
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

createTestUser()