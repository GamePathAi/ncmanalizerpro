import https from 'https';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function testNetworkConnectivity() {
  console.log('🌐 Testando conectividade de rede...');
  
  // Teste 1: Ping básico para o Supabase
  console.log('\n1. Testando conectividade HTTP básica...');
  try {
    const url = new URL(supabaseUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      timeout: 10000,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    };
    
    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        console.log('✅ Conectividade HTTP OK - Status:', res.statusCode);
        resolve(res);
      });
      
      req.on('error', (error) => {
        console.log('❌ Erro de conectividade HTTP:', error.message);
        reject(error);
      });
      
      req.on('timeout', () => {
        console.log('❌ Timeout na conexão HTTP');
        req.destroy();
        reject(new Error('Timeout'));
      });
      
      req.setTimeout(10000);
      req.end();
    });
    
  } catch (error) {
    console.log('❌ Falha na conectividade HTTP:', error.message);
  }
  
  // Teste 2: Supabase client com timeout customizado
  console.log('\n2. Testando cliente Supabase com configurações customizadas...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(15000) // 15 segundos de timeout
          });
        }
      }
    });
    
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Erro no cliente Supabase:', error.message);
    } else {
      console.log('✅ Cliente Supabase funcionando');
    }
    
  } catch (error) {
    console.log('❌ Erro no teste do cliente:', error.message);
  }
  
  // Teste 3: Verificar DNS
  console.log('\n3. Informações de DNS...');
  try {
    const url = new URL(supabaseUrl);
    console.log('Hostname:', url.hostname);
    console.log('URL completa:', supabaseUrl);
  } catch (error) {
    console.log('❌ Erro ao analisar URL:', error.message);
  }
  
  console.log('\n📋 Possíveis soluções:');
  console.log('1. Verificar conexão com a internet');
  console.log('2. Verificar se há firewall/antivírus bloqueando');
  console.log('3. Tentar usar VPN se houver restrições de rede');
  console.log('4. Verificar se o projeto Supabase está ativo');
  console.log('5. Tentar novamente em alguns minutos (pode ser instabilidade temporária)');
}

testNetworkConnectivity();