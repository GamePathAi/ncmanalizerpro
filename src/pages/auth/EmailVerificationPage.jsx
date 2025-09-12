import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

/**
 * Página de verificação de email
 * Exibida para usuários com status 'pending_email'
 */
const EmailVerificationPage = () => {
  const { user, userProfile, resendVerification, checkAuthState } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Verificar se há token de verificação na URL
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    // Se usuário já tem email verificado, redirecionar
    if (userProfile?.subscription_status !== 'pending_email') {
      const redirectPath = userProfile?.subscription_status === 'active' ? '/dashboard' : '/pricing';
      navigate(redirectPath, { replace: true });
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    // Se há token na URL, verificar automaticamente
    if (token && type === 'signup') {
      handleTokenVerification();
    }
  }, [token, type]);

  useEffect(() => {
    // Countdown para reenvio
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleTokenVerification = async () => {
    try {
      // O Supabase já processou o token, apenas verificar o estado
      await checkAuthState();
      
      // Mostrar sucesso e redirecionar
      setTimeout(() => {
        navigate('/pricing', { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Erro na verificação:', error);
      setResendError('Erro ao verificar email. Tente novamente.');
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const result = await resendVerification();
      
      if (result.success) {
        setResendSuccess(true);
        setCountdown(60); // 60 segundos de cooldown
        
        // Limpar mensagem de sucesso após 5 segundos
        setTimeout(() => {
          setResendSuccess(false);
        }, 5000);
      } else {
        setResendError(result.error || 'Erro ao reenviar email');
      }
    } catch (error) {
      setResendError('Erro inesperado ao reenviar email');
    } finally {
      setIsResending(false);
    }
  };

  // Se há token na URL, mostrar processamento
  if (token && type === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verificado!
            </h1>
            <p className="text-gray-600 mb-4">
              Seu email foi verificado com sucesso. Redirecionando...
            </p>
            <LoadingSpinner size="md" color="green" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <EnvelopeIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifique seu email
            </h1>
            <p className="text-gray-600">
              Enviamos um link de verificação para
            </p>
            <p className="font-medium text-gray-900 mt-1">
              {user?.email}
            </p>
          </div>

          {/* Instruções */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                Como verificar seu email:
              </h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Verifique sua caixa de entrada</li>
                <li>Procure por um email de "NCM Analyzer Pro"</li>
                <li>Clique no link "Confirmar email"</li>
                <li>Você será redirecionado automaticamente</li>
              </ol>
            </div>
          </div>

          {/* Mensagens de feedback */}
          {resendSuccess && (
            <div className="mb-4">
              <ErrorMessage
                type="info"
                title="Email reenviado!"
                message="Verifique sua caixa de entrada e spam."
                size="sm"
              />
            </div>
          )}

          {resendError && (
            <div className="mb-4">
              <ErrorMessage
                title="Erro ao reenviar"
                message={resendError}
                size="sm"
                dismissible
                onDismiss={() => setResendError(null)}
              />
            </div>
          )}

          {/* Botão de reenvio */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isResending || countdown > 0}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isResending ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Reenviando...
                </>
              ) : countdown > 0 ? (
                `Reenviar em ${countdown}s`
              ) : (
                'Reenviar email de verificação'
              )}
            </button>
          </div>

          {/* Dicas adicionais */}
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Não recebeu o email?
                  </h4>
                  <div className="mt-1 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Verifique a pasta de spam/lixo eletrônico</li>
                      <li>Aguarde alguns minutos (pode haver atraso)</li>
                      <li>Verifique se o email está correto</li>
                      <li>Tente reenviar o email</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Links de ação */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Email incorreto?
              <Link 
                to="/auth/register" 
                className="ml-1 font-medium text-blue-600 hover:text-blue-500"
              >
                Criar nova conta
              </Link>
            </p>
            
            <p className="text-sm text-gray-600">
              Já tem uma conta verificada?
              <Link 
                to="/auth/login" 
                className="ml-1 font-medium text-blue-600 hover:text-blue-500"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Problemas com a verificação?
            <a 
              href="mailto:support@ncmanalyzerpro.com" 
              className="ml-1 text-blue-600 hover:text-blue-500"
            >
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;