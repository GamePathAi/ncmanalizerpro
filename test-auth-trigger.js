import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuthTrigger() {
  try {
    console.log('🧪 Testando trigger de autenticação...')
    
    // Gerar email único
    const testEmail = `teste${Date.now()}@exemplo.com`
    const testPassword = 'senha123456'
    
    console.log('📧 Email de teste:', testEmail)
    
    // Teste 1: Verificar se consegue criar usuário
    console.log('\n1️⃣ Tentando criar usuário...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Teste',
          company: 'Empresa Teste'
        }
      }
    })
    
    if (signUpError) {
      console.error('❌ Erro no signUp:', signUpError)
      return false
    }
    
    console.log('✅ SignUp realizado com sucesso')
    console.log('👤 User ID:', signUpData.user?.id)
    
    // Aguardar um pouco para o trigger executar
    console.log('\n⏳ Aguardando trigger executar...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Teste 2: Verificar se o perfil foi criado
    console.log('\n2️⃣ Verificando se perfil foi criado...')
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', signUpData.user?.id)
      .single()
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError)
      console.log('🔍 Vamos verificar todos os perfis:')
      
      const { data: allProfiles, error: allError } = await supabase
        .from('user_profiles')
        .select('*')
      
      if (allError) {
        console.error('❌ Erro ao buscar todos os perfis:', allError)
      } else {
        console.log('📋 Todos os perfis:', allProfiles)
      }
      
      return false
    }
    
    console.log('✅ Perfil encontrado!')
    console.log('📋 Dados do perfil:', profileData)
    
    // Teste 3: Limpar dados de teste
    console.log('\n3️⃣ Limpando dados de teste...')
    
    // Deletar perfil
    const { error: deleteProfileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', signUpData.user?.id)
    
    if (deleteProfileError) {
      console.warn('⚠️ Aviso: Não foi possível deletar o perfil:', deleteProfileError.message)
    }
    
    console.log('✅ Teste concluído com sucesso!')
    return true
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    return false
  }
}

testAuthTrigger().then(success => {
  if (success) {
    console.log('\n🎉 Trigger de autenticação está funcionando!')
  } else {
    console.log('\n💥 Há problemas no trigger de autenticação')
    console.log('\n🔧 Possíveis soluções:')
    console.log('1. Verificar se o trigger handle_new_user existe')
    console.log('2. Verificar se a função handle_new_user está correta')
    console.log('3. Verificar RLS (Row Level Security) na tabela user_profiles')
    console.log('4. Verificar logs do Supabase Dashboard')
  }
})