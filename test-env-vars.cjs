require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

async function testEnvironmentVariables() {
  console.log('🔍 Testando variáveis de ambiente na função Edge...')
  
  try {
    const response = await fetch('http://127.0.0.1:54321/functions/v1/password-recovery/test-env', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LOCAL_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Status:', response.status)
    const result = await response.text()
    console.log('Response:', result)
    
  } catch (error) {
    console.error('❌ Erro ao testar variáveis:', error)
  }
}

testEnvironmentVariables()