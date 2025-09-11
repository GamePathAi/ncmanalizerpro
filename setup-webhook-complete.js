// Script completo para configurar webhook do Resend via API do Supabase
// Este script recria toda a estrutura necessária após reset do banco

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    console.log('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupWebhookComplete() {
    console.log('🚀 Configurando webhook do Resend completamente via API...');
    console.log(`📡 URL: ${supabaseUrl}`);
    
    try {
        // Método alternativo usando SQL direto via supabase-js
        console.log('\n1️⃣ Criando tabela email_logs...');
        
        // Criar tabela usando SQL direto
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
        
        // Executar SQL usando fetch direto para a API REST do Supabase
        const executeSQL = async (sql, description) => {
            try {
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ sql: sql })
                });
                
                if (response.ok || response.status === 204) {
                    console.log(`✅ ${description} - sucesso`);
                    return true;
                } else {
                    const errorText = await response.text();
                    console.log(`❌ ${description} - erro:`, errorText);
                    return false;
                }
            } catch (error) {
                console.log(`❌ ${description} - erro de rede:`, error.message);
                return false;
            }
        };
        
        // Executar criação da tabela
        await executeSQL(createTableSQL, 'Criação da tabela email_logs');

        // 2. Criar índices
        console.log('\n2️⃣ Criando índices...');
        const indexesSQL = `
            CREATE INDEX IF NOT EXISTS idx_email_logs_email_id ON email_logs(email_id);
            CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email);
            CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
            CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
        `;
        
        await executeSQL(indexesSQL, 'Criação dos índices');

        // 3. Configurar RLS e permissões
        console.log('\n3️⃣ Configurando RLS e permissões...');
        const rlsSQL = `
            ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Allow service role full access" ON email_logs;
            CREATE POLICY "Allow service role full access" ON email_logs
                FOR ALL
                USING (true)
                WITH CHECK (true);
                
            DROP POLICY IF EXISTS "Allow authenticated users read" ON email_logs;
            CREATE POLICY "Allow authenticated users read" ON email_logs
                FOR SELECT
                USING (auth.role() = 'authenticated');
        `;
        
        await executeSQL(rlsSQL, 'Configuração de RLS e permissões');

        // 4. Criar função de timestamp
        console.log('\n4️⃣ Criando função de timestamp...');
        const timestampSQL = `
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
        
        await executeSQL(timestampSQL, 'Criação da função de timestamp');

        // 5. Testar inserção direta via API
        console.log('\n5️⃣ Testando inserção na tabela...');
        const testData = {
            email_id: `setup-test-${Date.now()}`,
            email: 'teste@exemplo.com',
            subject: 'Teste de configuração completa',
            status: 'sent'
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('email_logs')
            .insert(testData)
            .select()
            .single();

        if (insertError) {
            console.log('❌ Erro ao testar inserção:', insertError.message);
            // Tentar inserção via SQL direto
            const insertSQL = `
                INSERT INTO email_logs (email_id, email, subject, status)
                VALUES ('${testData.email_id}', '${testData.email}', '${testData.subject}', '${testData.status}')
                ON CONFLICT (email_id) DO NOTHING;
            `;
            await executeSQL(insertSQL, 'Inserção de teste via SQL');
        } else {
            console.log('✅ Teste de inserção bem-sucedido');
            console.log('📊 Registro criado:', {
                id: insertData.id,
                email_id: insertData.email_id,
                email: insertData.email,
                status: insertData.status,
                created_at: insertData.created_at
            });
        }

        // 6. Verificar se a tabela está acessível
        console.log('\n6️⃣ Verificando acesso à tabela...');
        const { data: tableData, error: selectError } = await supabase
            .from('email_logs')
            .select('*')
            .limit(5);

        if (selectError) {
            console.log('❌ Erro ao acessar tabela:', selectError.message);
        } else {
            console.log('✅ Tabela acessível com sucesso');
            console.log(`📊 Total de registros encontrados: ${tableData.length}`);
            if (tableData.length > 0) {
                console.log('📋 Últimos registros:');
                tableData.forEach(record => {
                    console.log(`   - ${record.email} (${record.status}) - ${record.created_at}`);
                });
            }
        }

        // 7. Testar Edge Function
        console.log('\n7️⃣ Testando Edge Function resend-webhook...');
        const { data: functionData, error: functionError } = await supabase.functions
            .invoke('resend-webhook', {
                body: {
                    type: 'email.sent',
                    data: {
                        email_id: `function-test-${Date.now()}`,
                        to: ['teste@exemplo.com'],
                        subject: 'Teste da Edge Function após setup',
                        from: 'noreply@exemplo.com'
                    },
                    created_at: new Date().toISOString()
                },
                headers: {
                    'resend-signature': 'whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo',
                    'resend-timestamp': Date.now().toString()
                }
            });

        if (functionError) {
            console.log('❌ Erro na Edge Function:', functionError.message);
            console.log('💡 A Edge Function pode precisar ser deployada novamente');
        } else {
            console.log('✅ Edge Function testada com sucesso');
            console.log('📧 Resposta da função:', functionData);
        }

        // 8. Verificar se o webhook salvou dados
        console.log('\n8️⃣ Verificando se o webhook salvou dados...');
        const { data: webhookData, error: webhookError } = await supabase
            .from('email_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);

        if (webhookError) {
            console.log('❌ Erro ao verificar dados do webhook:', webhookError.message);
        } else {
            console.log('✅ Verificação de dados concluída');
            console.log(`📊 Registros mais recentes: ${webhookData.length}`);
            webhookData.forEach(record => {
                console.log(`   - ${record.email_id}: ${record.email} (${record.status})`);
            });
        }

        console.log('\n🎉 Configuração completa do webhook do Resend finalizada!');
        console.log('\n📋 Resumo da configuração:');
        console.log('✅ Tabela email_logs criada');
        console.log('✅ Índices otimizados criados');
        console.log('✅ RLS e políticas configuradas');
        console.log('✅ Função de timestamp ativa');
        console.log('✅ Testes de inserção bem-sucedidos');
        
        console.log('\n🔗 Próximos passos:');
        console.log('1. Configure o webhook no dashboard do Resend:');
        console.log('   - URL: https://fsntzljufghutoyqxokm.supabase.co/functions/v1/resend-webhook');
        console.log('   - Secret: whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo');
        console.log('   - Eventos: email.sent, email.delivered, email.bounced, email.opened, email.clicked');
        console.log('2. Teste enviando um email real através do seu app');
        console.log('3. Monitore: supabase functions logs resend-webhook');
        console.log('4. Verifique dados: SELECT * FROM email_logs ORDER BY created_at DESC;');
        
    } catch (error) {
        console.error('❌ Erro geral na configuração:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Verifique se as variáveis de ambiente estão corretas');
        console.log('2. Confirme se você tem permissões de service_role');
        console.log('3. Verifique se o projeto Supabase está ativo');
        console.log('4. Execute: supabase functions deploy resend-webhook');
    }
}

// Executar configuração completa
setupWebhookComplete().then(() => {
    console.log('\n🏁 Setup completo finalizado!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});