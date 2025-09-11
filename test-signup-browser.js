// Teste para simular exatamente o que acontece no browser
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testBrowserSignup() {
  console.log('🧪 Testando signup exatamente como no browser...')
  
  // Email único para teste
  const testEmail = `teste${Date.now()}@exemplo.com`
  const testPassword = '123456789'
  
  console.log(`📧 Email de teste: ${testEmail}`)
  
  try {
    console.log('\n🔄 Executando signUp...')
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (error) {
      console.log('❌ Erro no signup:')
      console.log('- Código:', error.status)
      console.log('- Mensagem:', error.message)
      console.log('- Detalhes:', error)
      
      // Verificar se é o erro específico
      if (error.message.includes('Error sending confirmation email')) {
        console.log('\n🎯 PROBLEMA CONFIRMADO:')
        console.log('- O erro "Error sending confirmation email" ainda persiste')
        console.log('- Isso significa que o trigger do webhook não está configurado')
        console.log('- SOLUÇÃO: Execute o SQL no dashboard do Supabase')
        console.log('- OU desabilite confirmação de email temporariamente')
      }
      
      return false
    }
    
    console.log('✅ Signup realizado com sucesso!')
    console.log('👤 Usuário criado:', {
      id: data.user?.id,
      email: data.user?.email,
      confirmed: data.user?.email_confirmed_at ? 'Sim' : 'Não'
    })
    
    console.log('📧 Sessão:', {
      access_token: data.session?.access_token ? 'Presente' : 'Ausente',
      refresh_token: data.session?.refresh_token ? 'Presente' : 'Ausente'
    })
    
    return true
    
  } catch (err) {
    console.log('💥 Erro inesperado:', err.message)
    return false
  }
}

async function checkAuthSettings() {
  console.log('\n🔍 Verificando configurações de autenticação...')
  
  try {
    // Tentar fazer uma query simples para verificar conexão
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error && !error.message.includes('does not exist')) {
      console.log('⚠️ Problema de conexão:', error.message)
    } else {
      console.log('✅ Conexão com Supabase OK')
    }
    
  } catch (err) {
    console.log('⚠️ Erro na verificação:', err.message)
  }
}

async function main() {
  console.log('🚀 TESTE DE SIGNUP - SIMULAÇÃO BROWSER')
  console.log('=====================================\n')
  
  await checkAuthSettings()
  
  const success = await testBrowserSignup()
  
  console.log('\n📊 RESULTADO:')
  if (success) {
    console.log('✅ Signup funcionando perfeitamente!')
    console.log('🎉 O problema "Failed to fetch" foi resolvido!')
  } else {
    console.log('❌ Signup ainda com problemas')
    console.log('📋 Consulte SOLUCAO_COMPLETA_EMAIL.md para resolver')
  }
  
  console.log('\n🔗 Próximos passos:')
  console.log('1. Testar no browser: http://localhost:5173')
  console.log('2. Implementar estados de usuário')
  console.log('3. Configurar integração com Stripe')
}

main().catch(console.error)