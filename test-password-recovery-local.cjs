const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Usar URLs locais do Supabase
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testPasswordRecoveryFlow() {
  console.log('🧪 Testando fluxo completo de recuperação de senha (LOCAL)...')
  
  const testEmail = 'test@example.com'
  
  try {
    // 1. Solicitar recuperação de senha
    console.log('\n1️⃣ Solicitando recuperação de senha...')
    const recoveryResponse = await fetch(`${supabaseUrl}/functions/v1/password-recovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ email: testEmail })
    })
    
    const recoveryData = await recoveryResponse.json()
    console.log('Resposta da recuperação:', recoveryData)
    
    if (recoveryResponse.status !== 200) {
      console.log('❌ Erro na solicitação de recuperação')
      return
    }
    
    console.log('✅ Solicitação de recuperação enviada com sucesso!')
    
    // 2. Simular busca do token (em produção, seria obtido do email)
    console.log('\n2️⃣ Buscando token na base de dados...')
    const { data: tokens, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (tokenError) {
      console.log('❌ Erro ao buscar token:', tokenError)
      return
    }
    
    if (!tokens || tokens.length === 0) {
      console.log('❌ Nenhum token encontrado')
      return
    }
    
    const token = tokens[0].token
    console.log('✅ Token encontrado:', token.substring(0, 10) + '...')
    
    // 3. Verificar token
    console.log('\n3️⃣ Verificando token...')
    const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/password-recovery/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ token })
    })
    
    const verifyData = await verifyResponse.json()
    console.log('Resposta da verificação:', verifyData)
    
    if (!verifyData.valid) {
      console.log('❌ Token inválido')
      return
    }
    
    console.log('✅ Token válido!')
    
    // 4. Redefinir senha
    console.log('\n4️⃣ Redefinindo senha...')
    const newPassword = 'novaSenha123!'
    const resetResponse = await fetch(`${supabaseUrl}/functions/v1/password-recovery/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ token, password: newPassword })
    })
    
    const resetData = await resetResponse.json()
    console.log('Resposta da redefinição:', resetData)
    
    if (resetData.success) {
      console.log('✅ Senha redefinida com sucesso!')
      console.log('\n🎉 Fluxo completo de recuperação de senha funcionando!')
    } else {
      console.log('❌ Erro na redefinição de senha')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testPasswordRecoveryFlow()