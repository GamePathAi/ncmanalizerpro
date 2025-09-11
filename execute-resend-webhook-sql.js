// Script para executar o SQL do webhook do Resend diretamente no Supabase
// Este script cria a tabela email_logs e configura as funções necessárias

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    console.log('Certifique-se de que VITE_SUPABASE_URL e uma chave de serviço estão configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeResendWebhookSQL() {
    console.log('🔧 Executando configuração do webhook do Resend...');
    console.log('\n⚠️ IMPORTANTE: Se houver erros, execute o SQL manualmente no dashboard do Supabase');
    
    try {
        // 1. Criar tabela email_logs
        console.log('\n1️⃣ Criando tabela email_logs...');
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS email_logs (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                email_id TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                subject TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                sent_at TIMESTAMPTZ,
                delivered_at TIMESTAMPTZ,
                delayed_at TIMESTAMPTZ,
                complained_at TIMESTAMPTZ,
                bounced_at TIMESTAMPTZ,
                bounce_reason TEXT,
                opened_at TIMESTAMPTZ,
                open_count INTEGER DEFAULT 0,
                clicked_at TIMESTAMPTZ,
                click_count INTEGER DEFAULT 0,
                last_clicked_url TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;
        
        const { error: tableError } = await supabase.rpc('exec', { sql: createTableSQL });
        if (tableError) {
            console.log('❌ Erro ao criar tabela:', tableError.message);
        } else {
            console.log('✅ Tabela email_logs criada com sucesso');
        }

        // 2. Criar índices
        console.log('\n2️⃣ Criando índices...');
        const indexesSQL = `
            CREATE INDEX IF NOT EXISTS idx_email_logs_email_id ON email_logs(email_id);
            CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email);
            CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
            CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
        `;
        
        const { error: indexError } = await supabase.rpc('exec', { sql: indexesSQL });
        if (indexError) {
            console.log('❌ Erro ao criar índices:', indexError.message);
        } else {
            console.log('✅ Índices criados com sucesso');
        }

        // 3. Configurar RLS e permissões
        console.log('\n3️⃣ Configurando permissões...');
        const permissionsSQL = `
            ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Allow service role full access" ON email_logs;
            CREATE POLICY "Allow service role full access" ON email_logs
                FOR ALL
                USING (true)
                WITH CHECK (true);
        `;
        
        const { error: permError } = await supabase.rpc('exec', { sql: permissionsSQL });
        if (permError) {
            console.log('❌ Erro ao configurar permissões:', permError.message);
        } else {
            console.log('✅ Permissões configuradas com sucesso');
        }

        // 4. Criar função de atualização de timestamp
        console.log('\n4️⃣ Criando função de timestamp...');
        const timestampFunctionSQL = `
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            DROP TRIGGER IF EXISTS update_email_logs_updated_at ON email_logs;
            CREATE TRIGGER update_email_logs_updated_at
                BEFORE UPDATE ON email_logs
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `;
        
        const { error: funcError } = await supabase.rpc('exec', { sql: timestampFunctionSQL });
        if (funcError) {
            console.log('❌ Erro ao criar função de timestamp:', funcError.message);
        } else {
            console.log('✅ Função de timestamp criada com sucesso');
        }

        // 5. Testar inserção na tabela
        console.log('\n5️⃣ Testando inserção na tabela...');
        const { data: testInsert, error: insertError } = await supabase
            .from('email_logs')
            .insert({
                email_id: `test-${Date.now()}`,
                email: 'teste@exemplo.com',
                subject: 'Teste de configuração',
                status: 'sent'
            })
            .select()
            .single();

        if (insertError) {
            console.log('❌ Erro ao testar inserção:', insertError.message);
        } else {
            console.log('✅ Teste de inserção bem-sucedido');
            console.log('📊 Registro criado:', {
                id: testInsert.id,
                email_id: testInsert.email_id,
                email: testInsert.email,
                status: testInsert.status
            });
        }

        // 6. Verificar se a Edge Function está deployada
        console.log('\n6️⃣ Testando Edge Function...');
        const { data: functionTest, error: functionError } = await supabase.functions
            .invoke('resend-webhook', {
                body: {
                    type: 'email.sent',
                    data: {
                        email_id: `function-test-${Date.now()}`,
                        to: ['teste@exemplo.com'],
                        subject: 'Teste da Edge Function'
                    }
                },
                headers: {
                    'resend-signature': 'whsec_test_signature',
                    'resend-timestamp': Date.now().toString()
                }
            });

        if (functionError) {
            console.log('❌ Erro na Edge Function:', functionError.message);
            console.log('💡 Verifique se foi deployada: supabase functions deploy resend-webhook');
        } else {
            console.log('✅ Edge Function testada com sucesso');
            console.log('📧 Resposta:', functionTest);
        }

        console.log('\n🎉 Configuração do webhook do Resend concluída!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Configure o webhook no dashboard do Resend:');
        console.log('   - URL: https://fsntzljufghutoyqxokm.supabase.co/functions/v1/resend-webhook');
        console.log('   - Secret: whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo');
        console.log('   - Eventos: email.sent, email.delivered, email.bounced, email.opened, email.clicked');
        console.log('2. Teste enviando um email real através do seu app');
        console.log('3. Monitore os logs: supabase functions logs resend-webhook');
        
    } catch (error) {
        console.error('❌ Erro geral na configuração:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Verifique se o .env está configurado corretamente');
        console.log('   2. Execute o SQL manualmente no dashboard do Supabase');
        console.log('   3. Verifique se a Edge Function foi deployada');
        console.log('   4. Confirme as variáveis de ambiente no Supabase');
    }
}

// Executar configuração
executeResendWebhookSQL().then(() => {
    console.log('\n🏁 Configuração concluída!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});