// Script para criar tabela email_logs diretamente via SQL no Supabase
// Usa uma abordagem alternativa quando a função exec não está disponível

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTableDirect() {
    console.log('🔧 Criando tabela email_logs diretamente...');
    
    try {
        // Método 1: Tentar criar via SQL usando rpc personalizada
        console.log('\n1️⃣ Tentando criar tabela via RPC...');
        
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
            
            -- Criar índices
            CREATE INDEX IF NOT EXISTS idx_email_logs_email_id ON email_logs(email_id);
            CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email);
            CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
            CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
            
            -- Configurar RLS
            ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
            
            -- Criar políticas
            DROP POLICY IF EXISTS "Allow service role full access" ON email_logs;
            CREATE POLICY "Allow service role full access" ON email_logs
                FOR ALL
                USING (true)
                WITH CHECK (true);
                
            DROP POLICY IF EXISTS "Allow authenticated users read" ON email_logs;
            CREATE POLICY "Allow authenticated users read" ON email_logs
                FOR SELECT
                USING (auth.role() = 'authenticated');
            
            -- Criar função de timestamp
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            -- Criar trigger
            DROP TRIGGER IF EXISTS update_email_logs_updated_at ON email_logs;
            CREATE TRIGGER update_email_logs_updated_at
                BEFORE UPDATE ON email_logs
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `;
        
        // Tentar diferentes métodos de execução
        const methods = [
            { name: 'exec_sql', params: { sql: createTableSQL } },
            { name: 'execute_sql', params: { query: createTableSQL } },
            { name: 'run_sql', params: { sql: createTableSQL } }
        ];
        
        let success = false;
        
        for (const method of methods) {
            try {
                console.log(`   Tentando método: ${method.name}`);
                const { data, error } = await supabase.rpc(method.name, method.params);
                
                if (!error) {
                    console.log(`✅ Sucesso com método: ${method.name}`);
                    success = true;
                    break;
                } else {
                    console.log(`❌ Erro com ${method.name}:`, error.message);
                }
            } catch (err) {
                console.log(`❌ Exceção com ${method.name}:`, err.message);
            }
        }
        
        if (!success) {
            console.log('\n⚠️ Nenhum método RPC funcionou. Tentando abordagem alternativa...');
            
            // Método 2: Usar fetch direto para a API REST
            console.log('\n2️⃣ Tentando via API REST direta...');
            
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                },
                body: JSON.stringify({ sql: createTableSQL })
            });
            
            if (response.ok) {
                console.log('✅ Tabela criada via API REST');
                success = true;
            } else {
                const errorText = await response.text();
                console.log('❌ Erro na API REST:', errorText);
            }
        }
        
        if (!success) {
            console.log('\n❌ Não foi possível criar a tabela via API.');
            console.log('\n📋 SOLUÇÃO MANUAL:');
            console.log('1. Acesse o dashboard do Supabase: https://supabase.com/dashboard/project/fsntzljufghutoyqxokm');
            console.log('2. Vá em "SQL Editor"');
            console.log('3. Cole e execute o SQL abaixo:');
            console.log('\n--- INÍCIO DO SQL ---');
            console.log(createTableSQL);
            console.log('--- FIM DO SQL ---\n');
            return false;
        }
        
        // 3. Testar se a tabela foi criada
        console.log('\n3️⃣ Testando se a tabela foi criada...');
        
        const { data: testData, error: testError } = await supabase
            .from('email_logs')
            .select('*')
            .limit(1);
            
        if (testError) {
            console.log('❌ Erro ao acessar tabela:', testError.message);
            return false;
        } else {
            console.log('✅ Tabela email_logs acessível!');
        }
        
        // 4. Inserir registro de teste
        console.log('\n4️⃣ Inserindo registro de teste...');
        
        const testRecord = {
            email_id: `direct-test-${Date.now()}`,
            email: 'teste@exemplo.com',
            subject: 'Teste de criação direta',
            status: 'sent'
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('email_logs')
            .insert(testRecord)
            .select()
            .single();
            
        if (insertError) {
            console.log('❌ Erro ao inserir teste:', insertError.message);
        } else {
            console.log('✅ Registro de teste inserido com sucesso!');
            console.log('📊 Dados:', {
                id: insertData.id,
                email_id: insertData.email_id,
                email: insertData.email,
                status: insertData.status
            });
        }
        
        // 5. Testar Edge Function
        console.log('\n5️⃣ Testando Edge Function com tabela criada...');
        
        const { data: functionData, error: functionError } = await supabase.functions
            .invoke('resend-webhook', {
                body: {
                    type: 'email.sent',
                    data: {
                        email_id: `edge-test-${Date.now()}`,
                        to: ['teste@exemplo.com'],
                        subject: 'Teste Edge Function com tabela',
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
        } else {
            console.log('✅ Edge Function funcionando!');
            console.log('📧 Resposta:', functionData);
        }
        
        // 6. Verificar registros finais
        console.log('\n6️⃣ Verificando registros na tabela...');
        
        const { data: finalData, error: finalError } = await supabase
            .from('email_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (finalError) {
            console.log('❌ Erro ao verificar registros:', finalError.message);
        } else {
            console.log('✅ Verificação final concluída!');
            console.log(`📊 Total de registros: ${finalData.length}`);
            finalData.forEach(record => {
                console.log(`   - ${record.email_id}: ${record.email} (${record.status})`);
            });
        }
        
        console.log('\n🎉 Configuração da tabela email_logs concluída!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Configure o webhook no Resend:');
        console.log('   - URL: https://fsntzljufghutoyqxokm.supabase.co/functions/v1/resend-webhook');
        console.log('   - Secret: whsec_Y87KKZQg2jd1q/pzyf7+nFCw4SSk2Jdo');
        console.log('2. Teste enviando um email real');
        console.log('3. Monitore: supabase functions logs resend-webhook');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        console.log('\n🔧 Execute o SQL manualmente no dashboard do Supabase');
        return false;
    }
}

// Executar criação
createTableDirect().then((success) => {
    if (success) {
        console.log('\n🏁 Criação da tabela finalizada com sucesso!');
        process.exit(0);
    } else {
        console.log('\n❌ Falha na criação automática. Use o método manual.');
        process.exit(1);
    }
}).catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});