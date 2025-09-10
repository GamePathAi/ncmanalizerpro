// Script para verificar configuração SMTP no Supabase
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.log('Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSMTPConfiguration() {
  console.log('🔍 Verificando configuração SMTP do Supabase...')
  console.log('📍 URL do projeto:', supabaseUrl)
  
  try {
    // Tentar fazer um cadastro de teste para verificar o erro
    const testEmail = `teste-smtp-${Date.now()}@exemplo.com`
    console.log('\n📧 Testando cadastro com email:', testEmail)
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TesteSmtp123!',
      options: {
        emailRedirectTo: 'http://localhost:5173/email-confirmation'
      }
    })
    
    if (error) {
      console.log('\n❌ Erro no cadastro:', error.message)
      console.log('📋 Detalhes do erro:', JSON.stringify(error, null, 2))
      
      // Analisar o tipo de erro
      if (error.message.includes('Error sending confirmation email')) {
        console.log('\n🚨 PROBLEMA IDENTIFICADO: Configuração de SMTP')
        console.log('\n📝 SOLUÇÕES POSSÍVEIS:')
        console.log('\n1️⃣ CONFIGURAR SMTP NO DASHBOARD:')
        console.log('   • Acesse: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm')
        console.log('   • Vá em Authentication > Settings')
        console.log('   • Role até "SMTP Settings"')
        console.log('   • Configure:')
        console.log('     - Enable custom SMTP: ✅')
        console.log('     - Host: smtp.resend.com')
        console.log('     - Port: 587')
        console.log('     - Username: resend')
        console.log('     - Password: re_JLRPpf2z_NRDkD1X5LwrggsUJeE4uHN4Y')
        console.log('     - Sender name: NCM Analyzer Pro')
        console.log('     - Sender email: noreply@ncmanalyzerpro.com')
        
        console.log('\n2️⃣ ALTERNATIVA RÁPIDA (DESENVOLVIMENTO):')
        console.log('   • Desabilite "Enable email confirmations"')
        console.log('   • Habilite "Enable automatic confirmation"')
        
        console.log('\n3️⃣ VERIFICAR API KEY DO RESEND:')
        console.log('   • Confirme se a API key está ativa no Resend')
        console.log('   • Verifique se o domínio está verificado')
      }
      
      return false
    }
    
    if (data.user && !data.user.email_confirmed_at) {
      console.log('\n✅ Cadastro realizado com sucesso!')
      console.log('📧 Email de confirmação deve ter sido enviado')
      console.log('👤 Usuário criado:', data.user.email)
      return true
    }
    
    if (data.user && data.user.email_confirmed_at) {
      console.log('\n✅ Cadastro realizado e email confirmado automaticamente!')
      console.log('👤 Usuário:', data.user.email)
      return true
    }
    
  } catch (error) {
    console.error('\n💥 Erro inesperado:', error.message)
    return false
  }
}

async function checkResendConfiguration() {
  console.log('\n🔧 Verificando configuração do Resend...')
  
  // Verificar se existe arquivo de configuração
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    const configFile = path.join(process.cwd(), 'CONFIGURACAO_EMAIL_RESEND.md')
    if (fs.existsSync(configFile)) {
      console.log('✅ Arquivo de configuração do Resend encontrado')
    } else {
      console.log('⚠️ Arquivo de configuração do Resend não encontrado')
    }
    
    // Verificar variáveis de ambiente relacionadas ao Resend
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      console.log('✅ RESEND_API_KEY encontrada no .env')
      console.log('🔑 Key:', resendKey.substring(0, 10) + '...')
    } else {
      console.log('⚠️ RESEND_API_KEY não encontrada no .env')
    }
    
  } catch (error) {
    console.log('⚠️ Não foi possível verificar arquivos de configuração')
  }
}

async function main() {
  console.log('🚀 Diagnóstico de Configuração SMTP - NCM Pro')
  console.log('=' .repeat(50))
  
  await checkResendConfiguration()
  await checkSMTPConfiguration()
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ Diagnóstico concluído!')
  console.log('\n💡 Próximo passo: Configure o SMTP no Supabase Dashboard')
  console.log('📖 Siga as instruções em CONFIGURACAO_EMAIL_RESEND.md')
}

// Executar diagnóstico
main().catch(console.error)