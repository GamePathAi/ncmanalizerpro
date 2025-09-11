// Diagnóstico do problema de email
// Este script verifica as configurações e tenta identificar o problema

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function diagnoseEmailIssue() {
    console.log('🔍 Diagnosticando problema de email...');
    
    // 1. Verificar variáveis de ambiente
    console.log('\n📋 Verificando variáveis de ambiente:');
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurada' : '❌ Não encontrada');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Configurada' : '❌ Não encontrada');
    
    if (!supabaseUrl || !supabaseKey) {
        console.log('\n❌ Variáveis básicas não configuradas. Verifique o arquivo .env');
        return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 2. Testar conexão básica
    console.log('\n🔗 Testando conexão com Supabase...');
    try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não existe, ok
            console.log('⚠️ Conexão com problema:', error.message);
        } else {
            console.log('✅ Conexão com Supabase OK');
        }
    } catch (err) {
        console.log('❌ Erro de conexão:', err.message);
    }
    
    // 3. Verificar se a Edge Function existe
    console.log('\n🔧 Verificando Edge Function...');
    try {
        const functionUrl = `${supabaseUrl}/functions/v1/send-confirmation-email`;
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                confirmation_url: 'https://test.com/confirm?token=test'
            })
        });
        
        console.log('Status da Edge Function:', response.status);
        
        if (response.status === 404) {
            console.log('❌ Edge Function não encontrada. Execute: supabase functions deploy send-confirmation-email');
        } else if (response.status === 500) {
            const errorText = await response.text();
            console.log('❌ Erro interno na Edge Function:', errorText);
        } else {
            console.log('✅ Edge Function respondeu (status:', response.status, ')');
        }
        
    } catch (err) {
        console.log('❌ Erro ao testar Edge Function:', err.message);
    }
    
    // 4. Verificar configuração de auth
    console.log('\n🔐 Verificando configuração de auth...');
    try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Sessão atual:', session ? 'Logado' : 'Não logado');
        
        // Tentar obter configurações de auth
        const { data: settings } = await supabase.auth.getUser();
        console.log('Auth disponível:', settings ? '✅' : '❌');
        
    } catch (err) {
        console.log('⚠️ Erro ao verificar auth:', err.message);
    }
    
    console.log('\n📝 Próximos passos sugeridos:');
    console.log('1. Verifique se a Edge Function foi deployada: supabase functions deploy send-confirmation-email');
    console.log('2. Verifique as secrets no Supabase: supabase secrets list');
    console.log('3. Verifique se o trigger SQL foi executado no dashboard');
    console.log('4. Teste manualmente a Edge Function no dashboard do Supabase');
}

// Executar diagnóstico
diagnoseEmailIssue().then(() => {
    console.log('\n🏁 Diagnóstico concluído');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erro no diagnóstico:', err);
    process.exit(1);
});