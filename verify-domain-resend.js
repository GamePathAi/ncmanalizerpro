/**
 * Script para verificar domínio no Resend
 * Execute: node verify-domain-resend.js
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

async function verifyDomain() {
  try {
    console.log('🔍 Verificando domínio no Resend...');
    console.log('📧 Domínio:', DOMAIN_NAME);
    
    // Primeiro, listar domínios para encontrar o ID
    const listResult = await resend.domains.list();
    const domain = listResult.data?.find(d => d.name === DOMAIN_NAME);
    
    if (!domain) {
      console.error('❌ Domínio não encontrado. Execute primeiro: node add-domain-resend.js');
      return;
    }
    
    console.log('📋 ID do domínio:', domain.id);
    console.log('📊 Status atual:', domain.status);
    
    // Obter detalhes do domínio
    const domainDetails = await resend.domains.get(domain.id);
    
    console.log('\n📝 Detalhes do domínio:');
    console.log('Nome:', domainDetails.data?.name);
    console.log('Status:', domainDetails.data?.status);
    console.log('Região:', domainDetails.data?.region);
    console.log('Criado em:', domainDetails.data?.created_at);
    
    if (domainDetails.data?.records) {
      console.log('\n📋 Registros DNS necessários:');
      domainDetails.data.records.forEach((record, index) => {
        console.log(`\n${index + 1}. Tipo: ${record.type}`);
        console.log(`   Nome: ${record.name}`);
        console.log(`   Valor: ${record.value}`);
        if (record.priority) {
          console.log(`   Prioridade: ${record.priority}`);
        }
      });
    }
    
    // Tentar verificar o domínio
    if (domainDetails.data?.status !== 'verified') {
      console.log('\n🔄 Tentando verificar domínio...');
      
      try {
        const verifyResult = await resend.domains.verify(domain.id);
        
        if (verifyResult.data?.status === 'verified') {
          console.log('✅ Domínio verificado com sucesso!');
          console.log('🎉 Agora você pode usar emails @ncmanalyzerpro.com.br');
          
          console.log('\n🔧 Próximo passo:');
          console.log('Configure o SMTP no Supabase com:');
          console.log('- Sender email: noreply@ncmanalyzerpro.com.br');
    console.log('- Ou qualquer email @ncmanalyzerpro.com.br');
          
        } else {
          console.log('⏳ Domínio ainda não verificado.');
          console.log('Status:', verifyResult.data?.status);
          console.log('\n💡 Dicas:');
          console.log('- Verifique se os registros DNS foram configurados corretamente');
          console.log('- Aguarde a propagação DNS (pode levar até 24h)');
          console.log('- Tente novamente mais tarde');
        }
        
      } catch (verifyError) {
        console.log('⏳ Verificação ainda não disponível.');
        console.log('Motivo:', verifyError.message);
        console.log('\n💡 Configure os registros DNS e tente novamente em algumas horas.');
      }
      
    } else {
      console.log('\n✅ Domínio já está verificado!');
      console.log('🎉 Você pode usar emails @ncmanalyzerpro.com.br');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar domínio:', error.message);
  }
}

// Executar
verifyDomain();