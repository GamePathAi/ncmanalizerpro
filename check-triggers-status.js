import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar variáveis do .env manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

try {
    const envContent = readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
} catch (error) {
    console.error('❌ Erro ao carregar .env:', error.message);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Configurações carregadas:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'não encontrada');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggersAndSchema() {
    console.log('\n🔍 Verificando triggers e estrutura do banco...');
    
    try {
        // 1. Verificar se a tabela user_profiles existe e sua estrutura
        console.log('\n1. Verificando estrutura da tabela user_profiles:');
        const { data: tableInfo, error: tableError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);
        
        if (tableError) {
            console.log('❌ Erro ao acessar user_profiles:', tableError.message);
        } else {
            console.log('✅ Tabela user_profiles acessível');
        }
        
        // 2. Tentar fazer um signup simples para ver o erro específico
        console.log('\n2. Testando signup para capturar erro específico:');
        const testEmail = `test-${Date.now()}@example.com`;
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: testEmail,
            password: 'test123456',
            options: {
                data: {
                    full_name: 'Test User'
                }
            }
        });
        
        if (signupError) {
            console.log('❌ Erro no signup:', signupError.message);
            console.log('Código:', signupError.status);
            console.log('Detalhes completos:', JSON.stringify(signupError, null, 2));
        } else {
            console.log('✅ Signup funcionou!');
            console.log('Usuário criado:', signupData.user?.email);
            console.log('ID do usuário:', signupData.user?.id);
        }
        
        // 3. Verificar se há registros na tabela user_profiles
        console.log('\n3. Verificando registros na user_profiles:');
        const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(5);
        
        if (profilesError) {
            console.log('❌ Erro ao buscar profiles:', profilesError.message);
        } else {
            console.log(`✅ Encontrados ${profiles.length} perfis na tabela`);
            if (profiles.length > 0) {
                console.log('Exemplo:', profiles[0]);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
    
    console.log('\n🏁 Verificação concluída');
}

checkTriggersAndSchema();