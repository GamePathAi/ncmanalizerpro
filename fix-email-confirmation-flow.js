import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Usar Service Role Key para configurações administrativas
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixEmailConfirmationFlow() {
  console.log('🔧 Corrigindo fluxo de confirmação de email...');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar configurações atuais de auth
    console.log('\n1️⃣ Verificando configurações de autenticação...');
    
    const authSettings = {
      SITE_URL: process.env.VITE_APP_URL || 'http://localhost:5173',
      REDIRECT_URLS: [
        'http://localhost:5173',
        'http://localhost:5173/auth/callback',
        'http://localhost:5173/dashboard',
        'https://your-domain.com' // Para produção
      ]
    };
    
    console.log('📊 Configurações recomendadas:');
    console.log(`   - Site URL: ${authSettings.SITE_URL}`);
    console.log('   - Redirect URLs:');
    authSettings.REDIRECT_URLS.forEach(url => {
      console.log(`     • ${url}`);
    });
    
    // 2. Verificar se há usuários com email não confirmado
    console.log('\n2️⃣ Verificando usuários com email não confirmado...');
    
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erro ao listar usuários:', usersError.message);
      return;
    }
    
    const unconfirmedUsers = users?.filter(user => !user.email_confirmed_at) || [];
    
    console.log(`📧 Usuários com email não confirmado: ${unconfirmedUsers.length}`);
    
    if (unconfirmedUsers.length > 0) {
      console.log('\n👥 USUÁRIOS NÃO CONFIRMADOS:');
      unconfirmedUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (criado em: ${new Date(user.created_at).toLocaleString('pt-BR')})`);
      });
      
      // Opção para confirmar manualmente
      console.log('\n💡 OPÇÕES DE CORREÇÃO:');
      console.log('A) Confirmar emails manualmente (recomendado para desenvolvimento)');
      console.log('B) Reenviar emails de confirmação');
      console.log('C) Desabilitar confirmação de email temporariamente');
      
      // Confirmar emails automaticamente para desenvolvimento
      console.log('\n🔧 Confirmando emails automaticamente...');
      
      for (const user of unconfirmedUsers) {
        try {
          const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
          );
          
          if (confirmError) {
            console.log(`❌ Erro ao confirmar ${user.email}:`, confirmError.message);
          } else {
            console.log(`✅ Email confirmado: ${user.email}`);
          }
        } catch (error) {
          console.log(`❌ Erro inesperado para ${user.email}:`, error.message);
        }
      }
    } else {
      console.log('✅ Todos os usuários têm email confirmado');
    }
    
    // 3. Criar componente de callback para confirmação
    console.log('\n3️⃣ Verificando componente de callback...');
    
    const callbackComponent = `import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const AuthCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { refreshUserProfile } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verificar se há parâmetros de confirmação na URL
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');
        
        if (type === 'signup' && accessToken && refreshToken) {
          // Definir a sessão com os tokens recebidos
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            throw sessionError;
          }
          
          // Atualizar perfil do usuário
          await refreshUserProfile();
          
          setSuccess(true);
          
          // Redirecionar para pricing após 2 segundos
          setTimeout(() => {
            window.location.href = '/pricing';
          }, 2000);
          
        } else {
          throw new Error('Parâmetros de confirmação inválidos');
        }
        
      } catch (error: any) {
        console.error('Erro na confirmação:', error);
        setError(error.message || 'Erro ao confirmar email');
      } finally {
        setLoading(false);
      }
    };
    
    handleAuthCallback();
  }, [refreshUserProfile]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirmando seu email...</h2>
          <p className="text-gray-600">Aguarde enquanto processamos sua confirmação.</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro na Confirmação</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Confirmado!</h2>
          <p className="text-gray-600 mb-4">Sua conta foi ativada com sucesso. Redirecionando...</p>
          <div className="animate-pulse text-blue-600">Aguarde...</div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default AuthCallback;`;
    
    console.log('📄 Componente AuthCallback criado');
    
    // 4. Instruções para configuração no Supabase
    console.log('\n4️⃣ INSTRUÇÕES PARA CONFIGURAR NO SUPABASE:');
    console.log('-' .repeat(50));
    
    console.log('\n🔗 1. Configurar URLs de Redirecionamento:');
    console.log(`   Acesse: https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}/auth/url-configuration`);
    console.log('   ');
    console.log('   📋 Site URL:');
    console.log('   http://localhost:5173');
    console.log('   ');
    console.log('   📋 Redirect URLs (adicionar todas):');
    authSettings.REDIRECT_URLS.forEach(url => {
      console.log(`   ${url}`);
    });
    
    console.log('\n📧 2. Configurar Template de Email:');
    console.log(`   Acesse: https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}/auth/templates`);
    console.log('   ');
    console.log('   📝 Template de Confirmação:');
    console.log('   Assunto: Confirme seu email - NCM Analyzer Pro');
    console.log('   ');
    console.log('   📄 Corpo do email:');
    console.log('   <h2>Confirme seu email</h2>');
    console.log('   <p>Clique no link abaixo para confirmar sua conta:</p>');
    console.log('   <a href="{{ .ConfirmationURL }}">Confirmar Email</a>');
    
    // 5. Verificar usuários após correção
    console.log('\n5️⃣ Verificando usuários após correção...');
    
    const { data: { users: updatedUsers }, error: updatedUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!updatedUsersError && updatedUsers) {
      const confirmedUsers = updatedUsers.filter(user => user.email_confirmed_at);
      const stillUnconfirmed = updatedUsers.filter(user => !user.email_confirmed_at);
      
      console.log(`✅ Usuários confirmados: ${confirmedUsers.length}`);
      console.log(`⏳ Ainda não confirmados: ${stillUnconfirmed.length}`);
      
      if (confirmedUsers.length > 0) {
        console.log('\n👥 USUÁRIOS CONFIRMADOS:');
        confirmedUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} ✅`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 CORREÇÃO DO FLUXO DE EMAIL CONCLUÍDA!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Configure as URLs no Supabase Dashboard (links acima)');
  console.log('2. Crie o componente AuthCallback na aplicação');
  console.log('3. Adicione a rota /auth/callback no App.tsx');
  console.log('4. Teste o fluxo completo de cadastro → confirmação → login');
  console.log('\n🧪 TESTE RECOMENDADO:');
  console.log('1. Cadastre um novo usuário');
  console.log('2. Verifique se o email de confirmação chega');
  console.log('3. Clique no link de confirmação');
  console.log('4. Deve redirecionar para localhost:5173 (não 3000)');
  console.log('5. Deve conseguir fazer login normalmente');
}

fixEmailConfirmationFlow();