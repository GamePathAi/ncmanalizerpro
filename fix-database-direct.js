import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixDatabaseDirect() {
  console.log('🔧 Tentando corrigir banco de dados diretamente...');
  
  try {
    // 1. Primeiro, vamos tentar criar a função handle_new_user
    console.log('1. Criando função handle_new_user...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Log para debug
          RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
          
          -- Inserir perfil do usuário
          INSERT INTO public.user_profiles (
              id,
              email,
              full_name,
              subscription_type,
              subscription_status,
              totp_enabled,
              created_at,
              updated_at
          )
          VALUES (
              NEW.id,
              NEW.email,
              COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
              'pending',
              'pending',
              FALSE,
              NOW(),
              NOW()
          );
          
          RAISE LOG 'Profile created successfully for user: %', NEW.id;
          
          RETURN NEW;
      EXCEPTION
          WHEN OTHERS THEN
              RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
              -- Não falhar o cadastro se houver erro na criação do perfil
              RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Tentar executar usando .sql() se disponível
    try {
      const { error: functionError } = await supabase.rpc('query', { query: createFunctionSQL });
      if (functionError) {
        console.log('❌ Erro ao criar função via RPC:', functionError.message);
      } else {
        console.log('✅ Função criada com sucesso!');
      }
    } catch (rpcError) {
      console.log('⚠️ RPC não disponível, tentando método alternativo...');
      
      // Método alternativo: usar fetch direto para a API REST
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ query: createFunctionSQL })
      });
      
      if (response.ok) {
        console.log('✅ Função criada via API REST!');
      } else {
        console.log('❌ Erro na API REST:', await response.text());
      }
    }
    
    // 2. Criar o trigger
    console.log('2. Criando trigger...');
    
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_new_user();
    `;
    
    try {
      const { error: triggerError } = await supabase.rpc('query', { query: createTriggerSQL });
      if (triggerError) {
        console.log('❌ Erro ao criar trigger:', triggerError.message);
      } else {
        console.log('✅ Trigger criado com sucesso!');
      }
    } catch (error) {
      console.log('❌ Erro ao criar trigger:', error.message);
    }
    
    console.log('\n📋 INSTRUÇÕES MANUAIS:');
    console.log('Se os comandos acima falharam, execute manualmente no Supabase Dashboard:');
    console.log('1. Vá para https://supabase.com/dashboard');
    console.log('2. Abra seu projeto NCM PRO');
    console.log('3. Vá em SQL Editor');
    console.log('4. Cole e execute o conteúdo do arquivo fix-trigger-only.sql');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixDatabaseDirect();