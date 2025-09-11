import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const EmailVerificationPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const maxResends = 3;

  const handleResendEmail = async () => {
    if (!user?.email || resendCount >= maxResends) return;

    setIsResending(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      setResendCount(prev => prev + 1);
      setMessage({
        type: 'success',
        text: 'Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.'
      });
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao reenviar email. Tente novamente.'
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'auth' } }));
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Ícone */}
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Confirme seu Email
          </h1>

          {/* Descrição */}
          <div className="text-gray-600 mb-8 space-y-3">
            <p>
              Enviamos um link de confirmação para:
            </p>
            <p className="font-semibold text-gray-900 bg-gray-50 py-2 px-4 rounded-lg">
              {user?.email}
            </p>
            <p className="text-sm">
              Clique no link do email para ativar sua conta e continuar.
            </p>
          </div>

          {/* Mensagem de feedback */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Botões */}
          <div className="space-y-4">
            {/* Botão Reenviar */}
            <button
              onClick={handleResendEmail}
              disabled={isResending || resendCount >= maxResends}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                resendCount >= maxResends
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isResending
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {isResending ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Reenviando...</span>
                </div>
              ) : resendCount >= maxResends ? (
                'Limite de reenvios atingido'
              ) : (
                `Reenviar Email ${resendCount > 0 ? `(${resendCount}/${maxResends})` : ''}`
              )}
            </button>

            {/* Botão Sair */}
            <button
              onClick={handleSignOut}
              className="w-full py-3 px-4 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Sair da Conta
            </button>
          </div>

          {/* Instruções adicionais */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Não recebeu o email?</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Verifique sua pasta de spam/lixo eletrônico</p>
              <p>• Aguarde alguns minutos, pode haver atraso</p>
              <p>• Certifique-se de que o email está correto</p>
            </div>
          </div>

          {/* Suporte */}
          <div className="mt-6 text-xs text-gray-500">
            Problemas? Entre em contato com o{' '}
            <a href="mailto:suporte@ncmpro.com" className="text-blue-600 hover:underline">
              suporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};