const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Usar URLs locais do Supabase com service role
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDatabase() {
  console.log('🔍 Testando acesso direto ao banco...')
  
  try {
    // 1. Verificar se a tabela existe
    console.log('\n1️⃣ Verificando tabela password_reset_tokens...')
    const { data: tables, error: tableError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.log('❌ Erro ao acessar tabela:', tableError)
      return
    }
    
    console.log('✅ Tabela password_reset_tokens existe!')
    console.log('📊 Registros existentes:', tables?.length || 0)
    
    // 2. Criar usuário de teste primeiro
    console.log('\n2️⃣ Criando usuário de teste...')
    const testEmail = 'test@example.com'
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'senha123!',
      email_confirm: true
    })
    
    if (userError) {
      console.log('❌ Erro ao criar usuário:', userError)
      return
    }
    
    console.log('✅ Usuário criado!')
    const testUserId = userData.user.id
    console.log('🆔 User ID:', testUserId)
    
    // 3. Inserir um token de teste
    console.log('\n3️⃣ Inserindo token de teste...')
    const testToken = 'test-token-' + Date.now()
    
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Expira em 24 horas
    
    const { data: insertData, error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        token: testToken,
        user_id: testUserId,
        email: testEmail,
        used: false,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
    
    if (insertError) {
      console.log('❌ Erro ao inserir token:', insertError)
      return
    }
    
    console.log('✅ Token inserido com sucesso!')
    console.log('🔑 Token:', testToken)
    
    // 3. Buscar o token inserido
    console.log('\n3️⃣ Buscando token inserido...')
    const { data: foundTokens, error: searchError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', testToken)
    
    if (searchError) {
      console.log('❌ Erro ao buscar token:', searchError)
      return
    }
    
    if (foundTokens && foundTokens.length > 0) {
      console.log('✅ Token encontrado!')
      console.log('📄 Dados:', foundTokens[0])
    } else {
      console.log('❌ Token não encontrado')
    }
    
    // 4. Limpar token de teste
    console.log('\n4️⃣ Limpando token de teste...')
    const { error: deleteError } = await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', testToken)
    
    if (deleteError) {
      console.log('❌ Erro ao deletar token:', deleteError)
    } else {
      console.log('✅ Token de teste removido!')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testDatabase()