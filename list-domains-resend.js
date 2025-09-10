/**
 * Script para listar domínios no Resend
 * Execute: node list-domains-resend.js
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.RESEND_API_KEY;

if (!API_KEY) {
  console.error('❌ RESEND_API_KEY não encontrada no .env');
  process.exit(1);
}

const resend = new Resend(API_KEY);

async function listDomains() {
  try {
    console.log('📋 Listando todos os domínios no Resend...');
    console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');
    
    const result = await resend.domains.list();
    
    console.log('\n📊 Resultado completo:', JSON.stringify(result, null, 2));
    
    if (result.data && result.data.length > 0) {
      console.log('\n✅ Domínios encontrados:');
      result.data.forEach((domain, index) => {
        console.log(`\n${index + 1}. ${domain.name}`);
        console.log(`   ID: ${domain.id}`);
        console.log(`   Status: ${domain.status}`);
        console.log(`   Região: ${domain.region || 'N/A'}`);
        console.log(`   Criado: ${domain.created_at}`);
      });
    } else {
      console.log('\n⚠️ Nenhum domínio encontrado.');
      console.log('Isso pode significar:');
      console.log('- A API key não tem permissão para listar domínios');
      console.log('- Não há domínios cadastrados ainda');
      console.log('- Erro na API do Resend');
    }
    
  } catch (error) {
    console.error('❌ Erro ao listar domínios:', error.message);
    console.error('Detalhes:', error);
  }
}

// Executar
listDomains();