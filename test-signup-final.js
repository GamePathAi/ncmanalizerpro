// Teste final para confirmar que o signup está funcionando
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFinalSignup() {
  console.log('🎯 TESTE FINAL - Signup após correção')
  console.log('==================================')
  
  console.log('🔗 URL do Supabase:', supabaseUrl)
  console.log('🔑 Chave anônima:', supabaseKey ? 'Configurada' : 'Ausente')
  
  // Email único para teste
  const testEmail = `teste-final-${Date.now()}@exemplo.com`
  const testPassword = '123456789'
  
  console.log(`\n📧 Testando com: ${testEmail}`)
  
  try {
    console.log('\n🚀 Executando signUp...')
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (error) {
      console.log('❌ ERRO no signup:')
      console.log('- Status:', error.status)
      console.log('- Mensagem:', error.message)
      console.log('- Detalhes completos:', JSON.stringify(error, null, 2))
      
      if (error.message.includes('Failed to fetch')) {
        console.log('\n🔍 DIAGNÓSTICO:')
        console.log('- O erro "Failed to fetch" ainda persiste')
        console.log('- Pode ser problema de rede ou configuração')
        console.log('- Verifique se o Supabase está acessível')
      }
      
      return false
    }
    
    console.log('\n✅ SUCESSO! Signup funcionando!')
    console.log('👤 Usuário criado:')
    console.log('- ID:', data.user?.id)
    console.log('- Email:', data.user?.email)
    console.log('- Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não')
    
    console.log('\n🔐 Sessão:')
    console.log('- Access Token:', data.session?.access_token ? 'Presente' : 'Ausente')
    console.log('- Refresh Token:', data.session?.refresh_token ? 'Presente' : 'Ausente')
    
    return true
    
  } catch (err) {
    console.log('\n💥 ERRO INESPERADO:')
    console.log('- Mensagem:', err.message)
    console.log('- Stack:', err.stack)
    return false
  }
}

async function main() {
  const success = await testFinalSignup()
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 RESULTADO FINAL:')
  
  if (success) {
    console.log('🎉 PROBLEMA RESOLVIDO!')
    console.log('✅ Signup funcionando perfeitamente')
    console.log('✅ Sem erro "Failed to fetch"')
    console.log('✅ Conexão com Supabase OK')
    console.log('\n🚀 Próximos passos:')
    console.log('1. Testar no browser: http://localhost:5173')
    console.log('2. Implementar sistema de estados de usuário')
    console.log('3. Configurar integração com Stripe')
  } else {
    console.log('❌ PROBLEMA AINDA PERSISTE')
    console.log('🔧 Ações necessárias:')
    console.log('1. Verificar conectividade com Supabase')
    console.log('2. Confirmar variáveis de ambiente')
    console.log('3. Limpar cache do browser')
    console.log('4. Verificar configurações de CORS')
  }
  
  console.log('\n📋 Status do sistema:')
  console.log('- Servidor dev:', 'http://localhost:5173')
  console.log('- Supabase URL:', supabaseUrl)
  console.log('- Configuração:', 'Remota (não local)')
}

main().catch(console.error)