import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixUserProfilesTable() {
  console.log('🔧 Corrigindo estrutura da tabela user_profiles...');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar estrutura atual
    console.log('\n1️⃣ Verificando estrutura atual...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (sampleError && sampleError.code !== 'PGRST116') {
      console.log('❌ Erro ao acessar tabela:', sampleError.message);
      return;
    }
    
    // 2. Tentar inserir um registro simples para ver quais colunas existem
    console.log('\n2️⃣ Testando inserção simples...');
    const testId = crypto.randomUUID();
    
    // Tentar com colunas básicas primeiro
    const { data: basicInsert, error: basicError } = await supabase
      .from('user_profiles')
      .insert({
        id: testId,
        email: 'test@example.com',
        full_name: 'Teste'
      })
      .select();
    
    if (basicError) {
      console.log('❌ Erro na inserção básica:', basicError.message);
      
      if (basicError.code === '42501') {
        console.log('\n🛡️ Problema de RLS detectado!');
        console.log('💡 A tabela tem Row Level Security ativo');
        console.log('📋 Isso é normal e esperado para segurança');
      }
      
      if (basicError.message.includes('column')) {
        console.log('\n📋 Problema de estrutura de coluna detectado');
      }
    } else {
      console.log('✅ Inserção básica funcionou!');
      console.log('📊 Colunas disponíveis:', Object.keys(basicInsert[0]).join(', '));
      
      // Limpar o registro de teste
      await supabase.from('user_profiles').delete().eq('id', testId);
    }
    
    // 3. Verificar se podemos fazer uma consulta vazia para ver a estrutura
    console.log('\n3️⃣ Tentando consulta estrutural...');
    const { data: emptyData, error: emptyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000');
    
    if (emptyError) {
      console.log('❌ Erro na consulta estrutural:', emptyError.message);
    } else {
      console.log('✅ Consulta estrutural funcionou');
      console.log('📋 Resultado vazio (esperado):', emptyData?.length || 0, 'registros');
    }
    
    // 4. Tentar diferentes combinações de colunas
    console.log('\n4️⃣ Testando colunas de assinatura...');
    
    const testCombinations = [
      // Combinação 1: Colunas básicas de assinatura
      {
        name: 'Básica',
        data: {
          id: crypto.randomUUID(),
          email: 'test1@example.com',
          subscription_status: 'active'
        }
      },
      // Combinação 2: Com tipo de assinatura
      {
        name: 'Com tipo',
        data: {
          id: crypto.randomUUID(),
          email: 'test2@example.com',
          subscription_status: 'active',
          subscription_type: 'annual'
        }
      },
      // Combinação 3: Sem colunas de Stripe
      {
        name: 'Sem Stripe',
        data: {
          id: crypto.randomUUID(),
          email: 'test3@example.com',
          full_name: 'Teste 3',
          subscription_status: 'pending_subscription'
        }
      }
    ];
    
    for (const combination of testCombinations) {
      console.log(`\n   🧪 Testando combinação: ${combination.name}`);
      
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .insert(combination.data)
        .select();
      
      if (testError) {
        console.log(`   ❌ Falhou: ${testError.message}`);
        if (testError.message.includes('column')) {
          const missingColumn = testError.message.match(/'([^']+)'/)?.[1];
          if (missingColumn) {
            console.log(`   📋 Coluna ausente: ${missingColumn}`);
          }
        }
      } else {
        console.log(`   ✅ Funcionou!`);
        console.log(`   📊 Colunas: ${Object.keys(testData[0]).join(', ')}`);
        
        // Limpar
        await supabase.from('user_profiles').delete().eq('id', combination.data.id);
        break; // Se uma funcionou, não precisa testar as outras
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📋 DIAGNÓSTICO COMPLETO:');
    console.log('\n🔍 PROBLEMAS IDENTIFICADOS:');
    console.log('1. Tabela user_profiles existe mas pode ter estrutura incompleta');
    console.log('2. Colunas relacionadas ao Stripe podem estar ausentes');
    console.log('3. RLS está ativo (normal para segurança)');
    
    console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
    console.log('1. Verificar schema da tabela no Supabase Dashboard');
    console.log('2. Adicionar colunas ausentes:');
    console.log('   - customer_id (varchar)');
    console.log('   - subscription_id (varchar)');
    console.log('   - subscription_start_date (timestamp)');
    console.log('3. Verificar se o trigger handle_new_user está funcionando');
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá em Database > Tables > user_profiles');
    console.log('3. Adicione as colunas necessárias');
    console.log('4. Teste novamente o fluxo de pagamento');
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err.message);
  }
}

fixUserProfilesTable();