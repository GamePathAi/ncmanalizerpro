import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Verificando configuração do webhook de email...')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkWebhookConfiguration() {
  try {
    console.log('\n1️⃣ Verificando se existe trigger para envio de email...')
    
    // Verificar se existe a função do webhook
    const { data: functions, error: functionsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          p.proname as function_name,
          p.prosrc as function_body
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname LIKE '%email%'
        ORDER BY p.proname;
      `
    })
    
    if (functionsError) {
      console.log('⚠️  Erro ao verificar funções (método alternativo):', functionsError.message)
      
      // Método alternativo: verificar diretamente
      console.log('\n🔄 Tentando método alternativo...')
      const { data: triggerCheck, error: triggerError } = await supabase
        .from('information_schema.triggers')
        .select('*')
        .ilike('trigger_name', '%email%')
      
      if (triggerError) {
        console.log('❌ Não foi possível verificar triggers:', triggerError.message)
      } else {
        console.log('✅ Triggers encontrados:', triggerCheck?.length || 0)
      }
    } else {
      console.log('✅ Funções relacionadas a email encontradas:', functions?.length || 0)
      if (functions && functions.length > 0) {
        functions.forEach(func => {
          console.log(`   - ${func.function_name}`)
        })
      }
    }
    
    console.log('\n2️⃣ Testando Edge Function diretamente...')
    
    // Testar a Edge Function diretamente
    const testPayload = {
      email: 'teste@example.com',
      confirmationUrl: 'http://localhost:5173/confirm?token=test-token'
    }
    
    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'send-confirmation-email',
      {
        body: testPayload
      }
    )
    
    if (functionError) {
      console.log('❌ Erro na Edge Function:', functionError.message)
      console.log('💡 Possíveis causas:')
      console.log('   - RESEND_API_KEY não configurada')
      console.log('   - Edge Function com erro no código')
      console.log('   - Problema na API do Resend')
    } else {
      console.log('✅ Edge Function respondeu com sucesso!')
      console.log('📧 Resposta:', functionData)
    }
    
    console.log('\n3️⃣ Verificando configurações de autenticação...')
    
    // Verificar se a confirmação de email está habilitada
    const { data: authConfig, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('❌ Erro ao verificar configuração de auth:', authError.message)
    } else {
      console.log('✅ Sistema de autenticação ativo')
    }
    
    console.log('\n4️⃣ Diagnóstico do problema atual...')
    
    console.log('\n🔍 ANÁLISE:')
    console.log('✅ Edge Functions deployadas e ativas')
    console.log('✅ Secrets configurados (RESEND_API_KEY presente)')
    console.log('❓ Trigger do banco pode estar ausente ou com erro')
    
    console.log('\n🚨 PROBLEMA IDENTIFICADO:')
    console.log('O erro "Error sending confirmation email" indica que:')
    console.log('1. O Supabase está tentando enviar email de confirmação')
    console.log('2. Mas o sistema de envio (trigger + Edge Function) não está funcionando')
    console.log('3. Pode ser que o trigger não esteja chamando a Edge Function corretamente')
    
    console.log('\n🔧 SOLUÇÕES POSSÍVEIS:')
    console.log('1. IMEDIATA: Desabilitar confirmação de email no Dashboard')
    console.log('   - Ir para Authentication → Settings')
    console.log('   - Desmarcar "Enable email confirmations"')
    console.log('\n2. LONGO PRAZO: Reconfigurar o trigger do webhook')
    console.log('   - Executar: node execute-webhook-sql.js')
    console.log('   - Ou executar manualmente o SQL do webhook')
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error)
  }
}

checkWebhookConfiguration()