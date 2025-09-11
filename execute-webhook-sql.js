// Script para executar o SQL do webhook diretamente no Supabase
// Este script aplica o trigger e função necessários para o email

import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    console.log('Certifique-se de que VITE_SUPABASE_URL e uma chave de serviço estão configuradas');
    process.exit(1);
}

async function executeSQL(sql) {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey
        },
        body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`SQL Error: ${error}`);
    }
    
    return response.json();
}

async function executeWebhookSQL() {
    console.log('🔧 Executando configuração do webhook...');
    console.log('\n⚠️ IMPORTANTE: Se houver erros, execute o SQL manualmente no dashboard do Supabase');
    
    try {
        // SQL completo para configurar o webhook
        const fullSQL = `
-- 1. Habilitar extensão HTTP
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Criar função do webhook
CREATE OR REPLACE FUNCTION send_confirmation_email_webhook()
RETURNS trigger AS $$
DECLARE
    confirmation_url text;
    edge_function_url text;
    response http_response;
    app_url text;
    anon_key text;
BEGIN
    -- URLs configuradas (substitua pelos valores reais)
    app_url := '${process.env.VITE_APP_URL || 'https://your-app.com'}';
    
    -- Construir URL de confirmação
    confirmation_url := app_url || '/confirm?token=' || NEW.confirmation_token;
    
    -- URL da Edge Function
    edge_function_url := '${supabaseUrl}/functions/v1/send-confirmation-email';
    
    -- Fazer requisição HTTP para a Edge Function
    SELECT * INTO response FROM http((
        'POST',
        edge_function_url,
        ARRAY[http_header('Content-Type', 'application/json'),
              http_header('Authorization', 'Bearer ${process.env.VITE_SUPABASE_ANON_KEY}')],
        json_build_object(
            'email', NEW.email,
            'confirmation_url', confirmation_url
        )::text
    ));
    
    -- Log da resposta
    RAISE LOG 'Email webhook response: % - %', response.status, response.content;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Erro no webhook de email: %', SQLERRM;
        RETURN NEW; -- Continuar mesmo com erro
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.confirmation_token IS NOT NULL)
    EXECUTE FUNCTION send_confirmation_email_webhook();
`;
        
        console.log('📝 SQL a ser executado:');
        console.log('=====================================');
        console.log(fullSQL);
        console.log('=====================================\n');
        
        console.log('❌ Não foi possível executar via API.');
        console.log('\n📋 INSTRUÇÕES MANUAIS:');
        console.log('1. Copie o SQL acima');
        console.log('2. Vá para o dashboard do Supabase');
        console.log('3. Abra o SQL Editor');
        console.log('4. Cole e execute o SQL');
        console.log('\n🔗 Dashboard: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0]);
        
        // Salvar SQL em arquivo para facilitar
        const fs = await import('fs');
        fs.writeFileSync('webhook-setup-manual.sql', fullSQL);
        console.log('\n💾 SQL salvo em: webhook-setup-manual.sql');
        
        console.log('\n🧪 Após executar o SQL, teste com: node test-webhook-simple.js');
        
    } catch (err) {
        console.error('❌ Erro durante a execução:', err.message);
        console.log('\n📋 Execute o SQL manualmente no dashboard do Supabase');
    }
}

// Executar configuração
executeWebhookSQL().then(() => {
    console.log('\n🏁 Instruções fornecidas');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});