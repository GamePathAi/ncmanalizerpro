// Script para testar o webhook do Resend
// Este script simula eventos do Resend para testar o webhook

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

async function testResendWebhook() {
    console.log('🧪 Testando webhook do Resend...');
    console.log('📧 URL do Supabase:', supabaseUrl);
    
    try {
        // 1. Testar conexão com a tabela email_logs
        console.log('\n1️⃣ Verificando tabela email_logs...');
        const { data: tableCheck, error: tableError } = await supabase
            .from('email_logs')
            .select('count')
            .limit(1);
        
        if (tableError) {
            console.log('❌ Tabela email_logs não encontrada:', tableError.message);
            console.log('💡 Execute o SQL: setup-resend-webhook.sql no dashboard do Supabase');
            return;
        }
        console.log('✅ Tabela email_logs encontrada');

        // 2. Testar Edge Function do webhook
        console.log('\n2️⃣ Testando Edge Function do webhook...');
        
        // Simular evento de email enviado
        const emailSentEvent = {
            type: 'email.sent',
            data: {
                email_id: `test-${Date.now()}`,
                to: ['teste@exemplo.com'],
                subject: 'Teste do Webhook',
                from: 'noreply@ncmanalyzerpro.com.br',
                created_at: new Date().toISOString()
            }
        };

        const { data: webhookData, error: webhookError } = await supabase.functions
            .invoke('resend-webhook', {
                body: emailSentEvent,
                headers: {
                    'resend-signature': 'whsec_test_signature',
                    'resend-timestamp': Date.now().toString()
                }
            });

        if (webhookError) {
            console.log('❌ Erro na Edge Function do webhook:', webhookError.message);
            console.log('💡 Verifique se a função foi deployada: supabase functions deploy resend-webhook');
        } else {
            console.log('✅ Edge Function do webhook executada com sucesso');
            console.log('📧 Resposta:', webhookData);
        }

        // 3. Verificar se o log foi salvo
        console.log('\n3️⃣ Verificando logs salvos...');
        const { data: logs, error: logsError } = await supabase
            .from('email_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (logsError) {
            console.log('❌ Erro ao buscar logs:', logsError.message);
        } else {
            console.log('✅ Logs encontrados:', logs.length);
            if (logs.length > 0) {
                console.log('📊 Último log:', {
                    email_id: logs[0].email_id,
                    email: logs[0].email,
                    status: logs[0].status,
                    created_at: logs[0].created_at
                });
            }
        }

        // 4. Testar diferentes tipos de eventos
        console.log('\n4️⃣ Testando eventos adicionais...');
        
        const events = [
            {
                type: 'email.delivered',
                data: { email_id: emailSentEvent.data.email_id }
            },
            {
                type: 'email.opened',
                data: { email_id: emailSentEvent.data.email_id }
            },
            {
                type: 'email.clicked',
                data: { 
                    email_id: emailSentEvent.data.email_id,
                    link: { url: 'https://exemplo.com/confirmar' }
                }
            }
        ];

        for (const event of events) {
            console.log(`📨 Testando evento: ${event.type}`);
            
            const { error: eventError } = await supabase.functions
                .invoke('resend-webhook', {
                    body: event,
                    headers: {
                        'resend-signature': 'whsec_test_signature',
                        'resend-timestamp': Date.now().toString()
                    }
                });

            if (eventError) {
                console.log(`❌ Erro no evento ${event.type}:`, eventError.message);
            } else {
                console.log(`✅ Evento ${event.type} processado`);
            }

            // Pequena pausa entre eventos
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 5. Verificar estatísticas finais
        console.log('\n5️⃣ Estatísticas finais...');
        const { data: finalLogs } = await supabase
            .from('email_logs')
            .select('*')
            .eq('email_id', emailSentEvent.data.email_id)
            .single();

        if (finalLogs) {
            console.log('📊 Estatísticas do email de teste:', {
                status: finalLogs.status,
                open_count: finalLogs.open_count,
                click_count: finalLogs.click_count,
                delivered_at: finalLogs.delivered_at,
                opened_at: finalLogs.opened_at,
                clicked_at: finalLogs.clicked_at
            });
        }

        console.log('\n🎯 Próximos passos:');
        console.log('1. Execute: supabase functions deploy resend-webhook');
        console.log('2. Configure o webhook no dashboard do Resend:');
        console.log('   - URL: https://fsntzljufghutoyqxokm.supabase.co/functions/v1/resend-webhook');
        console.log('   - Secret: whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo');
        console.log('   - Eventos: email.sent, email.delivered, email.bounced, email.opened, email.clicked');
        console.log('3. Teste enviando um email real através do seu app');
        
    } catch (error) {
        console.error('❌ Erro geral no teste:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Verifique se o .env está configurado corretamente');
        console.log('   2. Execute o SQL setup-resend-webhook.sql no dashboard');
        console.log('   3. Faça deploy da Edge Function: supabase functions deploy resend-webhook');
        console.log('   4. Configure o webhook no dashboard do Resend');
    }
}

// Executar teste
testResendWebhook().then(() => {
    console.log('\n🏁 Teste do webhook concluído!');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});