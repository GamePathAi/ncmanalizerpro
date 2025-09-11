// Teste simples do webhook de email
// Este script testa se o webhook está configurado corretamente

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    console.log('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhook() {
    console.log('🧪 Testando webhook de email...');
    
    try {
        // Tentar fazer signup de teste
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = 'TestPassword123!';
        
        console.log(`📧 Tentando criar usuário: ${testEmail}`);
        
        const { data, error } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        });
        
        if (error) {
            console.error('❌ Erro no signup:', error.message);
            return;
        }
        
        if (data.user) {
            console.log('✅ Usuário criado com sucesso!');
            console.log('📧 Email de confirmação deve ter sido enviado');
            console.log('🔍 Verifique os logs do Supabase para confirmar o webhook');
        } else {
            console.log('⚠️ Usuário não foi criado');
        }
        
    } catch (err) {
        console.error('❌ Erro durante o teste:', err.message);
    }
}

// Executar teste
testWebhook().then(() => {
    console.log('\n🏁 Teste concluído');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});