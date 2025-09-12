import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const EmailVerificationPage = () => {
  const { user, profile, verifyEmail, resendVerification, checkAuthStatus } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Verificar token na URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleVerifyEmail(token);
    }
  }, [searchParams]);

  // Cooldown para reenvio
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Verificar se ainda precisa de verificação
  useEffect(() => {
    if (profile && profile.subscription_status !== 'pending_email') {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  const handleVerifyEmail = async (token) => {
    setIsVerifying(true);
    setError('');
    setMessage('');

    try {
      const result = await verifyEmail(token);
      
      if (result.success) {
        setMessage('Email verificado com sucesso! Redirecionando...');
        
        // Aguardar um pouco e verificar status
        setTimeout(async () => {
          await checkAuthStatus();
          navigate('/pricing');
        }, 2000);
      } else {
        setError(result.error || 'Erro ao verificar email');
      }
    } catch (err) {
      setError('Erro inesperado ao verificar email');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user?.email || resendCooldown > 0) return;

    setIsResending(true);
    setError('');
    setMessage('');

    try {
      const result = await resendVerification(user.email);
      
      if (result.success) {
        setMessage('Email de verificação reenviado! Verifique sua caixa de entrada.');
        setResendCooldown(60); // 60 segundos de cooldown
      } else {
        setError(result.error || 'Erro ao reenviar email');
      }
    } catch (err) {
      setError('Erro inesperado ao reenviar email');
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verificando email...</h2>
          <p className="text-gray-600">Aguarde enquanto confirmamos seu email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Confirme seu email
          </h1>
          <p className="text-gray-600">
            Enviamos um link de confirmação para
          </p>
          <p className="font-semibold text-gray-900 mt-1">
            {user?.email}
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-green-800 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">O que fazer agora:</h3>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
                1
              </span>
              Verifique sua caixa de entrada
            </li>
            <li className="flex items-start">
              <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
                2
              </span>
              Clique no link de confirmação
            </li>
            <li className="flex items-start">
              <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
                3
              </span>
              Volte aqui para continuar
            </li>
          </ol>
        </div>

        {/* Resend Button */}
        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={isResending || resendCooldown > 0}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isResending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Reenviando...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reenviar em {resendCooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reenviar email
              </>
            )}
          </button>

          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Voltar ao login
            </button>
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              Não recebeu o email?
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Verifique a pasta de spam</li>
              <li>• Aguarde alguns minutos</li>
              <li>• Verifique se o email está correto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;