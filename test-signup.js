// Script completo para testar cadastro com campos TOTP
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fsntzljufghutoyqxokm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTY0MDEsImV4cCI6MjA2OTE3MjQwMX0.MTkYFy_FfnGOiHrDVjV3AWDYao8YLQf1TnnBWeJwG-I'
)

async function testSignup() {
  console.log('🧪 Testando cadastro completo com campos TOTP...')
  
  const testEmail = `teste${Date.now()}@exemplo.com`
  const testPassword = 'MinhaSenh@123'
  const testFullName = 'Usuário Teste TOTP'
  
  console.log(`📧 Email de teste: ${testEmail}`)
  console.log(`👤 Nome completo: ${testFullName}`)
  
  try {
    // Tentar fazer cadastro com metadados
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName
        }
      }
    })
    
    if (error) {
      console.error('❌ Erro no cadastro:')
      console.error('Mensagem:', error.message)
      console.error('Código:', error.status)
      console.error('Detalhes completos:', JSON.stringify(error, null, 2))
      return
    }
    
    console.log('✅ Cadastro realizado com sucesso!')
    console.log('ID do usuário:', data.user?.id)
    console.log('Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não')
    console.log('Metadados:', JSON.stringify(data.user?.user_metadata, null, 2))
    
    // Aguardar um pouco para o trigger processar
    console.log('⏳ Aguardando 5 segundos para o trigger processar...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Tentar buscar o perfil criado
    console.log('🔍 Verificando se perfil foi criado com campos TOTP...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single()
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:')
      console.error('Mensagem:', profileError.message)
      console.error('Código:', profileError.code)
      console.error('Detalhes:', JSON.stringify(profileError, null, 2))
      return
    }
    
    console.log('✅ Perfil encontrado com sucesso!')
    console.log('📋 Dados do perfil:')
    console.log('- ID:', profile.id)
    console.log('- Email:', profile.email)
    console.log('- Nome completo:', profile.full_name)
    console.log('- Tipo de assinatura:', profile.subscription_type)
    console.log('- Status da assinatura:', profile.subscription_status)
    console.log('- TOTP habilitado:', profile.totp_enabled)
    console.log('- TOTP secret:', profile.totp_secret ? 'Definido' : 'Não definido')
    console.log('- Códigos de backup:', profile.totp_backup_codes ? `${profile.totp_backup_codes.length} códigos` : 'Nenhum')
    console.log('- Criado em:', profile.created_at)
    console.log('- Atualizado em:', profile.updated_at)
    
    // Verificar se todos os campos esperados estão presentes
    const expectedFields = ['id', 'email', 'full_name', 'subscription_type', 'subscription_status', 'totp_enabled', 'created_at', 'updated_at']
    const missingFields = expectedFields.filter(field => profile[field] === undefined)
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Campos ausentes:', missingFields.join(', '))
    } else {
      console.log('✅ Todos os campos obrigatórios estão presentes!')
    }
    
    // Testar se as funções TOTP foram criadas
    console.log('\n🔧 Testando funções TOTP...')
    
    try {
      const { data: backupCodes, error: backupError } = await supabase.rpc('generate_totp_backup_codes')
      
      if (backupError) {
        console.error('❌ Erro ao testar função generate_totp_backup_codes:')
        console.error('Mensagem:', backupError.message)
      } else {
        console.log('✅ Função generate_totp_backup_codes funcionando!')
        console.log('📝 Códigos gerados:', backupCodes?.length || 0, 'códigos')
      }
    } catch (err) {
      console.error('❌ Erro ao chamar função TOTP:', err.message)
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:')
    console.error(err.message)
    console.error(err.stack)
  }
}

testSignup()