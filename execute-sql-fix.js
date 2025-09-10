import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão no .env');
  process.exit(1);
}

// Usar anon key (limitado, mas pode mostrar instruções)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeSQLFix() {
  console.log('🔧 Mostrando instruções para correção manual...');
  
  try {
    // Ler o arquivo SQL e mostrar instruções
    const sqlContent = fs.readFileSync('fix-trigger-final.sql', 'utf8');
    
    console.log('\n📋 INSTRUÇÕES PARA CORREÇÃO:');
    console.log('=' .repeat(60));
    console.log('1. Abra o painel do Supabase: https://supabase.com/dashboard');
    console.log('2. Vá para seu projeto NCM PRO');
    console.log('3. Clique em "SQL Editor" no menu lateral');
    console.log('4. Cole o SQL abaixo e clique em "Run"');
    console.log('=' .repeat(60));
    console.log('\n📄 CONTEÚDO DO SQL:');
    console.log('\n' + sqlContent);
    console.log('\n=' .repeat(60));
    console.log('\n✅ Após executar o SQL, teste com: node test-signup-minimal.js');
    
  } catch (readError) {
    console.error('❌ Erro ao ler arquivo SQL:', readError.message);
    console.log('\n📋 INSTRUÇÕES ALTERNATIVAS:');
    console.log('1. Abra o arquivo fix-trigger-final.sql');
    console.log('2. Copie todo o conteúdo');
    console.log('3. Execute no painel do Supabase -> SQL Editor');
  }
}

executeSQLFix();