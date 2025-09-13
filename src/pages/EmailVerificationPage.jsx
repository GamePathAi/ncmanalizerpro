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
      // Usar Edge Function para verificar email
      const { supabase } = await import('../lib/supabase');
      const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
      
      const response = await fetch(`${functionsUrl}/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessage('Email verificado com sucesso! Redirecionando...');
        
        // Atualizar contexto de autenticação
        await checkAuthStatus();
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/pricing');
        }, 2000);
      } else {
        setError(result.error || 'Erro ao verificar email');
      }
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      setError('Erro ao verificar email. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user || resendCooldown > 0) return;
    
    setIsResending(true);
    setError('');
    setMessage('');

    try {
      // Usar Edge Function para reenviar email
      const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
      
      const response = await fetch(`${functionsUrl}/send-confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          type: 'email_verification'
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessage('Email de verificação reenviado com sucesso!');
        setResendCooldown(60); // 60 segundos de cooldown
      } else {
        setError(result.error || 'Erro ao reenviar email');
      }
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      setError('Erro ao reenviar email. Tente novamente.');
    } finally {
      setIsResending(false);
    }
  };

  // Se não há usuário, redirecionar para login
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verifique seu email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enviamos um link de verificação para <strong>{user?.email}</strong>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Mensagens */}
          {message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-800">{message}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instruções */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Clique no link que enviamos para seu email para verificar sua conta.
            </p>
            <p className="text-xs text-gray-500">
              Não recebeu o email? Verifique sua pasta de spam ou clique no botão abaixo para reenviar.
            </p>
          </div>

          {/* Botão de reenvio */}
          <div className="text-center">
            <button
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Reenviando...
                </>
              ) : resendCooldown > 0 ? (
                `Aguarde ${resendCooldown}s`
              ) : (
                <>
                  <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                  Reenviar email
                </>
              )}
            </button>
          </div>

          {/* Loading de verificação */}
          {isVerifying && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center">
                <RefreshCw className="animate-spin h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-gray-600">Verificando email...</span>
              </div>
            </div>
          )}

          {/* Link para voltar */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Voltar ao login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;