import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente não encontradas!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSignupWithDirectProfile() {
    const testEmail = `direct-test-${Date.now()}@exemplo.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Usuário Teste Direto';
    
    console.log('🧪 Testando cadastro com criação direta de perfil...');
    console.log('📧 Email de teste:', testEmail);
    console.log('👤 Nome completo:', testName);
    
    try {
        console.log('\n🔄 Iniciando cadastro...');
        
        // 1. Criar usuário
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                data: {
                    full_name: testName
                }
            }
        });
        
        if (authError) {
            console.error('❌ Erro no cadastro:', authError.message);
            return;
        }
        
        console.log('✅ Usuário criado com sucesso!');
        console.log('🆔 ID do usuário:', authData.user.id);
        console.log('📧 Email confirmado:', authData.user.email_confirmed_at ? 'Sim' : 'Não');
        
        // 2. Criar perfil diretamente (sem depender do trigger)
        console.log('\n🔄 Criando perfil diretamente...');
        
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                email: authData.user.email,
                full_name: testName,
                subscription_type: 'free',
                subscription_status: 'active',
                totp_enabled: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (profileError) {
            console.error('❌ Erro ao criar perfil:', profileError.message);
            console.log('Código:', profileError.code);
            console.log('Detalhes:', profileError.details);
        } else {
            console.log('✅ Perfil criado com sucesso!');
            console.log('📋 Dados do perfil:', profileData);
        }
        
        // 3. Verificar se o perfil foi criado
        console.log('\n🔍 Verificando perfil criado...');
        
        const { data: checkProfile, error: checkError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        
        if (checkError) {
            console.error('❌ Erro ao verificar perfil:', checkError.message);
        } else {
            console.log('✅ Perfil encontrado!');
            console.log('📋 Perfil:', checkProfile);
        }
        
        // 4. Limpar dados de teste
        console.log('\n🧹 Limpando dados de teste...');
        
        // Deletar perfil
        await supabase
            .from('user_profiles')
            .delete()
            .eq('id', authData.user.id);
        
        // Deletar usuário (usando service role)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
        
        if (deleteError) {
            console.log('⚠️ Erro ao deletar usuário:', deleteError.message);
        } else {
            console.log('✅ Dados de teste limpos!');
        }
        
    } catch (err) {
        console.error('❌ Erro geral:', err.message);
    }
}

async function updateAuthCode() {
    console.log('\n🔧 Sugestão: Atualizar código de cadastro para criar perfil diretamente');
    console.log('\n📝 Código sugerido para o frontend:');
    console.log('=' .repeat(60));
    
    const codeExample = `
// No arquivo de cadastro (signup)
async function handleSignup(email, password, fullName) {
    try {
        // 1. Criar usuário
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });
        
        if (authError) throw authError;
        
        // 2. Criar perfil diretamente (não depender do trigger)
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                email: authData.user.email,
                full_name: fullName,
                subscription_type: 'free',
                subscription_status: 'pending_subscription',
                totp_enabled: false
            });
        
        if (profileError) {
            console.warn('Erro ao criar perfil:', profileError.message);
            // Não falhar o cadastro por causa do perfil
        }
        
        return { success: true, user: authData.user };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}
`;
    
    console.log(codeExample);
    console.log('=' .repeat(60));
    
    console.log('\n💡 Vantagens desta abordagem:');
    console.log('✅ Não depende de triggers do banco');
    console.log('✅ Controle total no frontend');
    console.log('✅ Mais fácil de debugar');
    console.log('✅ Funciona mesmo sem RLS configurado');
}

async function main() {
    await testSignupWithDirectProfile();
    await updateAuthCode();
}

main().catch(console.error);