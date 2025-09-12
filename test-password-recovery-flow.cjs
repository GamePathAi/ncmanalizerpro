const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testPasswordRecoveryFlow() {
  console.log('🧪 Testando fluxo completo de recuperação de senha...')
  
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
    
    // 2. Buscar token gerado na tabela (simulando click no email)
    console.log('\n2️⃣ Buscando token gerado...')
    const { data: tokens, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('email', testEmail)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (tokenError || !tokens || tokens.length === 0) {
      console.log('❌ Token não encontrado:', tokenError)
      return
    }
    
    const token = tokens[0].token
    console.log('✅ Token encontrado:', token.substring(0, 8) + '...')
    
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
    
    // 4. Redefinir senha
    console.log('\n4️⃣ Redefinindo senha...')
    const newPassword = 'newpassword123'
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
    
    if (resetResponse.status === 200) {
      console.log('\n✅ Fluxo de recuperação de senha funcionando corretamente!')
      console.log('📧 Email seria enviado para:', testEmail)
      console.log('🔑 Nova senha definida com sucesso')
    } else {
      console.log('❌ Erro na redefinição de senha')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testPasswordRecoveryFlow()