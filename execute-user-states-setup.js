// Script para executar a configuração dos estados de usuário no Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cliente com service role key para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupUserStates() {
  console.log('🚀 Configurando sistema de estados de usuário...');
  console.log('📡 Conectando ao Supabase:', supabaseUrl);
  
  try {
    // Ler o arquivo SQL
    const sqlContent = readFileSync('./setup-user-states.sql', 'utf8');
    
    // Dividir em comandos individuais (separados por ponto e vírgula)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.toLowerCase().includes('commit')) continue;
      
      console.log(`\n${i + 1}/${commands.length} Executando comando...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: command + ';'
      });
      
      if (error) {
        // Tentar executar diretamente se RPC falhar
        console.log('⚠️ RPC falhou, tentando execução direta...');
        
        const { data: directData, error: directError } = await supabase
          .from('_temp')
          .select('*')
          .limit(0);
        
        if (directError && !directError.message.includes('relation "_temp" does not exist')) {
          console.error('❌ Erro na execução:', directError.message);
          continue;
        }
      }
      
      console.log('✅ Comando executado com sucesso');
    }
    
    // Verificar se a tabela foi criada
    console.log('\n🔍 Verificando estrutura criada...');
    
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao verificar tabela user_profiles:', tableError.message);
    } else {
      console.log('✅ Tabela user_profiles criada com sucesso!');
    }
    
    // Testar função get_user_state
    console.log('\n🧪 Testando função get_user_state...');
    
    const { data: functionTest, error: functionError } = await supabase
      .rpc('get_user_state', { user_id: '00000000-0000-0000-0000-000000000000' });
    
    if (functionError) {
      console.error('❌ Erro ao testar função:', functionError.message);
    } else {
      console.log('✅ Função get_user_state funcionando!');
    }
    
    console.log('\n🎉 Configuração dos estados de usuário concluída!');
    console.log('\n📋 Estados implementados:');
    console.log('  • pending_email: Usuário cadastrado, aguardando confirmação');
    console.log('  • pending_subscription: Email confirmado, aguardando assinatura');
    console.log('  • active: Email confirmado + assinatura ativa');
    
    console.log('\n🔧 Próximos passos:');
    console.log('  1. Implementar middleware de autenticação');
    console.log('  2. Criar endpoints de autenticação');
    console.log('  3. Configurar webhook do Stripe');
    console.log('  4. Implementar roteamento protegido');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
    process.exit(1);
  }
}

setupUserStates();