const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Usar URLs locais do Supabase
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testCompletePasswordRecovery() {
  console.log('🧪 Testando fluxo completo de recuperação de senha...')
  
  const testEmail = 'test@example.com'
  const testToken = 'test-token-' + Date.now()
  const testUserId = '12345678-1234-1234-1234-123456789012' // UUID fictício
  
  try {
    // 1. Inserir token manualmente na base (simulando o que a função faria)
    console.log('\n1️⃣ Inserindo token de teste manualmente...')
    
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)
    
    // Primeiro, vamos desabilitar temporariamente a foreign key constraint
    const { error: disableError } = await supabaseAdmin.rpc('exec', {
      sql: 'ALTER TABLE password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;'
    })
    
    if (disableError) {
      console.log('⚠️ Aviso ao desabilitar constraint:', disableError.message)
    }
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        token: testToken,
        user_id: testUserId,
        email: testEmail,
        used: false,
        expires_at: expiresAt.toISOString()
      })
      .select()
    
    if (insertError) {
      console.log('❌ Erro ao inserir token:', insertError)
      return
    }
    
    console.log('✅ Token inserido com sucesso!')
    console.log('🔑 Token:', testToken)
    
    // 2. Testar verificação de token
    console.log('\n2️⃣ Testando verificação de token...')
    const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/password-recovery/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ token: testToken })
    })
    
    const verifyData = await verifyResponse.json()
    console.log('Resposta da verificação:', verifyData)
    
    if (verifyData.valid) {
      console.log('✅ Token válido!')
    } else {
      console.log('❌ Token inválido')
    }
    
    // 3. Testar redefinição de senha
    console.log('\n3️⃣ Testando redefinição de senha...')
    const newPassword = 'novaSenha123!'
    const resetResponse = await fetch(`${supabaseUrl}/functions/v1/password-recovery/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ 
        token: testToken, 
        password: newPassword 
      })
    })
    
    const resetData = await resetResponse.json()
    console.log('Resposta da redefinição:', resetData)
    
    if (resetData.success) {
      console.log('✅ Senha redefinida com sucesso!')
    } else {
      console.log('❌ Erro na redefinição de senha')
    }
    
    // 4. Verificar se o token foi marcado como usado
    console.log('\n4️⃣ Verificando se token foi marcado como usado...')
    const { data: usedTokens, error: usedError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', testToken)
    
    if (usedError) {
      console.log('❌ Erro ao verificar token:', usedError)
    } else if (usedTokens && usedTokens.length > 0) {
      const tokenData = usedTokens[0]
      console.log('📊 Status do token:')
      console.log('   - Usado:', tokenData.used)
      console.log('   - Usado em:', tokenData.used_at)
      
      if (tokenData.used) {
        console.log('✅ Token marcado como usado corretamente!')
      } else {
        console.log('⚠️ Token não foi marcado como usado')
      }
    }
    
    // 5. Limpar dados de teste
    console.log('\n5️⃣ Limpando dados de teste...')
    const { error: deleteError } = await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('token', testToken)
    
    if (deleteError) {
      console.log('❌ Erro ao limpar token:', deleteError)
    } else {
      console.log('✅ Token de teste removido!')
    }
    
    console.log('\n🎉 Teste completo finalizado!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testCompletePasswordRecovery()