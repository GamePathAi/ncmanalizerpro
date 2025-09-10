/**
 * Script para adicionar domínio no Resend
 * Execute: node add-domain-resend.js
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

// Configuração
const DOMAIN_NAME = 'ncmanalyzerpro.com.br';
const API_KEY = process.env.RESEND_API_KEY;

if (!API_KEY) {
  console.error('❌ RESEND_API_KEY não encontrada no .env');
  process.exit(1);
}

const resend = new Resend(API_KEY);

async function addDomain() {
  try {
    console.log('🚀 Adicionando domínio no Resend...');
    console.log('📧 Domínio:', DOMAIN_NAME);
    console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');
    
    // Adicionar domínio
    const result = await resend.domains.create({ 
      name: DOMAIN_NAME 
    });
    
    console.log('\n✅ Domínio adicionado com sucesso!');
    console.log('📋 ID do domínio:', result.data?.id);
    console.log('📧 Nome:', result.data?.name);
    console.log('📊 Status:', result.data?.status);
    
    if (result.data?.records) {
      console.log('\n📝 Registros DNS necessários:');
      result.data.records.forEach((record, index) => {
        console.log(`\n${index + 1}. Tipo: ${record.type}`);
        console.log(`   Nome: ${record.name}`);
        console.log(`   Valor: ${record.value}`);
        if (record.priority) {
          console.log(`   Prioridade: ${record.priority}`);
        }
      });
    }
    
    console.log('\n🔧 Próximos passos:');
    console.log('1. Configure os registros DNS no seu provedor de domínio');
    console.log('2. Aguarde a propagação DNS (pode levar até 24h)');
    console.log('3. Execute: node verify-domain-resend.js');
    
    return result.data;
    
  } catch (error) {
    console.error('❌ Erro ao adicionar domínio:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 O domínio já existe. Listando domínios...');
      await listDomains();
    }
  }
}

async function listDomains() {
  try {
    const result = await resend.domains.list();
    
    console.log('\n📋 Domínios existentes:');
    if (result.data && result.data.length > 0) {
      result.data.forEach((domain, index) => {
        console.log(`\n${index + 1}. ${domain.name}`);
        console.log(`   ID: ${domain.id}`);
        console.log(`   Status: ${domain.status}`);
        console.log(`   Criado: ${domain.created_at}`);
      });
    } else {
      console.log('Nenhum domínio encontrado.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao listar domínios:', error.message);
  }
}

// Executar
addDomain();