import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testando signup sem confirmação de email...')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignupSemConfirmacao() {
  try {
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    console.log('📧 Tentando signup sem confirmação de email...')
    console.log('Email:', testEmail)
    
    // Método 1: Signup básico (pode ainda tentar enviar email)
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
      console.log('❌ Erro no signup básico:', error.message)
      console.log('Código:', error.status)
      
      if (error.message.includes('confirmation email')) {
        console.log('\n🚨 CONFIRMADO: Problema é o envio de email de confirmação')
        console.log('\n📋 SOLUÇÕES NECESSÁRIAS:')
        console.log('1. Desabilitar confirmação de email no Supabase Dashboard:')
        console.log('   - Ir para Authentication → Settings')
        console.log('   - Desmarcar "Enable email confirmations"')
        console.log('   - Salvar configurações')
        console.log('\n2. OU configurar SMTP customizado (ver CONFIGURAR_SMTP_RESEND.md)')
        console.log('\n3. Após configurar, testar novamente')
        
        return false
      }
    } else {
      console.log('✅ Signup realizado com sucesso!')
      console.log('User ID:', data.user?.id)
      console.log('Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não')
      
      // Testar login imediato
      console.log('\n🔐 Testando login imediato...')
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      
      if (loginError) {
        console.log('❌ Erro no login:', loginError.message)
      } else {
        console.log('✅ Login funcionando!')
        console.log('Sessão ativa:', !!loginData.session)
      }
      
      return true
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error)
    return false
  }
}

async function verificarConfiguracaoAuth() {
  console.log('\n🔍 Verificando configurações de autenticação...')
  
  try {
    // Tentar obter configurações públicas
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('❌ Erro ao verificar sessão:', error.message)
    } else {
      console.log('✅ Sistema de autenticação ativo')
    }
    
    // Informações sobre o projeto
    console.log('\n📊 Informações do projeto:')
    console.log('URL:', supabaseUrl)
    console.log('Projeto ID:', supabaseUrl.split('//')[1].split('.')[0])
    
  } catch (error) {
    console.error('Erro ao verificar configurações:', error)
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico completo...\n')
  
  await verificarConfiguracaoAuth()
  
  const sucesso = await testSignupSemConfirmacao()
  
  if (sucesso) {
    console.log('\n🎉 SUCESSO! O problema foi resolvido.')
    console.log('✅ Signup e login funcionando normalmente')
    console.log('\n📋 Próximos passos:')
    console.log('1. Testar no browser/aplicação React')
    console.log('2. Implementar sistema de estados de usuário')
    console.log('3. Configurar SMTP para emails profissionais (opcional)')
  } else {
    console.log('\n❌ PROBLEMA PERSISTE')
    console.log('\n🔧 Ações necessárias:')
    console.log('1. Acessar Supabase Dashboard')
    console.log('2. Ir para Authentication → Settings')
    console.log('3. Desabilitar "Enable email confirmations"')
    console.log('4. Executar este script novamente')
  }
}

main().catch(console.error)