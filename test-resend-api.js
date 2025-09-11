// Teste da API do Resend para diagnosticar problemas
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://fsntzljufghutoyqxokm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbnR6bGp1ZmdodXRveXF4b2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE0NzYsImV4cCI6MjA1MDU0NzQ3Nn0.Ej6Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testResendAPI() {
  console.log('🔍 Testando configuração da API Resend...');
  
  try {
    // Teste 1: Verificar se a Edge Function está acessível
    console.log('\n1. Testando conectividade com Edge Function...');
    const response = await fetch(`${supabaseUrl}/functions/v1/send-confirmation-email`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Edge Function acessível');
    } else {
      console.log('❌ Edge Function não acessível:', response.status);
    }
    
    // Teste 2: Testar envio de email com dados válidos
    console.log('\n2. Testando envio de email...');
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-confirmation-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'teste@exemplo.com',
        confirmationUrl: 'https://exemplo.com/confirm?token=123',
        userId: 'test-user-id'
      })
    });
    
    const emailResult = await emailResponse.json();
    
    if (emailResponse.ok) {
      console.log('✅ Email enviado com sucesso:', emailResult);
    } else {
      console.log('❌ Erro ao enviar email:');
      console.log('Status:', emailResponse.status);
      console.log('Resposta:', emailResult);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testResendAPI();