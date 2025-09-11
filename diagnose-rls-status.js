// Script para diagnosticar o status do RLS e políticas após execução do SQL
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Variáveis de ambiente não encontradas');
    console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
    console.log('VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseRLSStatus() {
    console.log('🔍 Diagnosticando problemas com signup...');
    
    try {
        // 1. Testar conexão básica
        console.log('\n1. Testando conexão com Supabase:');
        const { data: connectionTest, error: connError } = await supabase
            .from('user_profiles')
            .select('count')
            .limit(1);
        
        if (connError) {
            console.log('❌ Erro de conexão:', connError.message);
            console.log('Detalhes:', connError);
        } else {
            console.log('✅ Conexão funcionando');
        }
        
        // 2. Testar inserção direta na tabela user_profiles
        console.log('\n2. Testando inserção direta na tabela user_profiles:');
        const testEmail = `test-direct-${Date.now()}@example.com`;
        const testId = crypto.randomUUID();
        
        const { data: insertTest, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
                id: testId,
                email: testEmail,
                full_name: 'Test User'
            })
            .select();
        
        if (insertError) {
            console.log('❌ Erro na inserção direta:', insertError.message);
            console.log('Código do erro:', insertError.code);
            console.log('Detalhes completos:', insertError);
        } else {
            console.log('✅ Inserção direta funcionou:', insertTest);
            
            // Limpar o teste
            await supabase
                .from('user_profiles')
                .delete()
                .eq('email', testEmail);
        }
        
        // 3. Testar signup básico
        console.log('\n3. Testando signup básico:');
        const signupEmail = `test-signup-${Date.now()}@example.com`;
        
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: signupEmail,
            password: 'test123456'
        });
        
        if (signupError) {
            console.log('❌ Erro no signup:', signupError.message);
            console.log('Código do erro:', signupError.status);
            console.log('Detalhes completos:', signupError);
        } else {
            console.log('✅ Signup funcionou:', {
                user_id: signupData.user?.id,
                email: signupData.user?.email,
                confirmation_sent_at: signupData.user?.confirmation_sent_at
            });
        }
        
        // 4. Verificar se a tabela user_profiles existe
        console.log('\n4. Verificando estrutura da tabela user_profiles:');
        const { data: tableCheck, error: tableError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(0);
        
        if (tableError) {
            console.log('❌ Problema com a tabela:', tableError.message);
        } else {
            console.log('✅ Tabela user_profiles acessível');
        }
        
    } catch (error) {
        console.log('❌ Erro geral no diagnóstico:', error.message);
    }
}

// Executar diagnóstico
diagnoseRLSStatus().then(() => {
    console.log('\n🏁 Diagnóstico concluído');
}).catch(error => {
    console.log('❌ Erro fatal:', error.message);
});