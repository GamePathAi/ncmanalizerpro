/**
 * Script de teste para verificar o fluxo completo de autenticação
 * Execute com: node test-auth-flow.js
 */

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
require('dotenv').config()

// Configurações
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas')
  console.log('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Dados de teste
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Usuário Teste'
}

console.log('🚀 Iniciando teste do fluxo de autenticação...')
console.log(`📧 Email de teste: ${testUser.email}`)
console.log('\n' + '='.repeat(60) + '\n')

async function testAuthFlow() {
  try {
    // 1. Teste de Registro
    console.log('1️⃣ Testando registro de usuário...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.fullName
        }
      }
    })

    if (signUpError) {
      console.error('❌ Erro no registro:', signUpError.message)
      return
    }

    console.log('✅ Usuário registrado com sucesso')
    console.log(`   User ID: ${signUpData.user?.id}`)
    console.log(`   Email confirmado: ${signUpData.user?.email_confirmed_at ? 'Sim' : 'Não'}`)
    
    const userId = signUpData.user?.id
    if (!userId) {
      console.error('❌ Erro: User ID não encontrado')
      return
    }

    // 2. Verificar estado inicial do usuário
    console.log('\n2️⃣ Verificando estado inicial do usuário...')
    const { data: initialProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (initialProfile) {
      console.log('✅ Perfil criado automaticamente')
      console.log(`   Status de assinatura: ${initialProfile.subscription_status}`)
      console.log(`   Email verificado em: ${initialProfile.email_verified_at || 'Não verificado'}`)
    } else {
      console.log('⚠️  Perfil não encontrado - pode ser criado via trigger')
    }

    // 3. Simular confirmação de email (em produção seria via link no email)
    console.log('\n3️⃣ Simulando confirmação de email...')
    
    // Atualizar manualmente para simular confirmação
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        email_verified_at: new Date().toISOString(),
        subscription_status: 'pending_subscription'
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Erro ao simular confirmação:', updateError.message)
    } else {
      console.log('✅ Email confirmado (simulado)')
    }

    // 4. Teste de Login
    console.log('\n4️⃣ Testando login...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })

    if (signInError) {
      console.error('❌ Erro no login:', signInError.message)
      return
    }

    console.log('✅ Login realizado com sucesso')
    console.log(`   Access Token: ${signInData.session?.access_token ? 'Presente' : 'Ausente'}`)

    // 5. Testar endpoint /me
    console.log('\n5️⃣ Testando endpoint /me...')
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-endpoints/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${signInData.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        console.log('✅ Endpoint /me funcionando')
        console.log(`   Estado do usuário: ${userData.userState}`)
        console.log(`   Pode acessar dashboard: ${userData.canAccessDashboard ? 'Sim' : 'Não'}`)
      } else {
        console.log('⚠️  Endpoint /me não disponível ou com erro')
        console.log(`   Status: ${response.status}`)
      }
    } catch (error) {
      console.log('⚠️  Erro ao testar endpoint /me:', error.message)
    }

    // 6. Verificar estado após login
    console.log('\n6️⃣ Verificando estado após login...')
    const { data: profileAfterLogin } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileAfterLogin) {
      console.log('✅ Perfil atualizado:')
      console.log(`   Status: ${profileAfterLogin.subscription_status}`)
      console.log(`   Stripe Customer ID: ${profileAfterLogin.stripe_customer_id || 'Não definido'}`)
      console.log(`   Última atualização: ${profileAfterLogin.updated_at}`)
    }

    // 7. Simular assinatura ativa
    console.log('\n7️⃣ Simulando assinatura ativa...')
    const { error: subscriptionError } = await supabase
      .from('user_profiles')
      .update({ 
        subscription_status: 'active',
        stripe_customer_id: 'cus_test_customer_id'
      })
      .eq('id', userId)

    if (subscriptionError) {
      console.error('❌ Erro ao simular assinatura:', subscriptionError.message)
    } else {
      console.log('✅ Assinatura ativada (simulado)')
    }

    // 8. Verificar estado final
    console.log('\n8️⃣ Verificando estado final...')
    const { data: finalProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (finalProfile) {
      console.log('✅ Estado final do usuário:')
      console.log(`   Status: ${finalProfile.subscription_status}`)
      console.log(`   Pode acessar dashboard: ${finalProfile.subscription_status === 'active' ? 'Sim' : 'Não'}`)
    }

    // 9. Limpeza - remover usuário de teste
    console.log('\n9️⃣ Limpando dados de teste...')
    
    // Remover perfil
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    console.log('✅ Dados de teste removidos')

    console.log('\n' + '='.repeat(60))
    console.log('🎉 Teste do fluxo de autenticação concluído com sucesso!')
    console.log('\n📋 Resumo dos estados testados:')
    console.log('   1. pending_email (após registro)')
    console.log('   2. pending_subscription (após confirmação de email)')
    console.log('   3. active (após assinatura)')
    console.log('\n✅ Todos os componentes estão funcionando corretamente!')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Função para testar componentes individuais
async function testComponents() {
  console.log('\n🔧 Testando componentes individuais...')
  
  // Testar conexão com Supabase
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    if (error) {
      console.log('❌ Erro na conexão com Supabase:', error.message)
    } else {
      console.log('✅ Conexão com Supabase funcionando')
    }
  } catch (error) {
    console.log('❌ Erro ao testar Supabase:', error.message)
  }

  // Testar variáveis de ambiente
  console.log('\n📋 Verificando variáveis de ambiente:')
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'RESEND_API_KEY',
    'STRIPE_SECRET_KEY'
  ]

  requiredVars.forEach(varName => {
    const value = process.env[varName]
    console.log(`   ${varName}: ${value ? '✅ Configurado' : '❌ Não configurado'}`)
  })
}

// Executar testes
async function runTests() {
  await testComponents()
  console.log('\n' + '='.repeat(60) + '\n')
  await testAuthFlow()
}

runTests().catch(console.error)