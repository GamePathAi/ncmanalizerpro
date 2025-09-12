import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, CheckCircle, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    user, 
    verifyEmail, 
    resendVerificationEmail,
    getUserStatus,
    needsEmailVerification 
  } = useAuth();
  
  const [status, setStatus] = useState('checking'); // checking, success, error, resending
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleVerifyEmail(token);
    } else if (needsEmailVerification()) {
      setStatus('waiting');
      setMessage('Verifique seu email para continuar');
    } else {
      // Usuário já verificado, redirecionar baseado no status
      const userStatus = getUserStatus();
      if (userStatus === 'pending_subscription') {
        navigate('/pricing');
      } else if (userStatus === 'active') {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [token, user, navigate]);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerifyEmail = async (verificationToken) => {
    try {
      setStatus('checking');
      setMessage('Verificando seu email...');
      
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Email verificado com sucesso!');
        
        // Atualizar contexto de autenticação
        if (verifyEmail) {
          await verifyEmail();
        }
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/pricing');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Token inválido ou expirado');
      }
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      setStatus('error');
      setMessage('Erro ao verificar email. Tente novamente.');
    }
  };

  const handleResendEmail = async () => {
    if (!canResend || !user?.email) return;

    try {
      setStatus('resending');
      setCanResend(false);
      setResendCooldown(60); // 60 segundos de cooldown
      
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('waiting');
        setMessage('Email de verificação reenviado! Verifique sua caixa de entrada.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Erro ao reenviar email');
        setCanResend(true);
        setResendCooldown(0);
      }
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      setStatus('error');
      setMessage('Erro ao reenviar email. Tente novamente.');
      setCanResend(true);
      setResendCooldown(0);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
      case 'resending':
        return <LoadingSpinner size="lg" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'waiting':
      default:
        return <Mail className="w-16 h-16 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'checking':
      case 'resending':
        return 'text-blue-600';
      case 'waiting':
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Ícone de Status */}
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'success' ? 'Email Verificado!' :
             status === 'error' ? 'Erro na Verificação' :
             status === 'checking' ? 'Verificando...' :
             status === 'resending' ? 'Reenviando...' :
             'Confirme seu Email'}
          </h1>

          {/* Mensagem */}
          <p className={`text-lg mb-6 ${getStatusColor()}`}>
            {message || 'Enviamos um link de verificação para seu email.'}
          </p>

          {/* Email do usuário */}
          {user?.email && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Email enviado para:</p>
              <p className="font-semibold text-gray-900">{user.email}</p>
            </div>
          )}

          {/* Ações */}
          <div className="space-y-4">
            {/* Botão Reenviar */}
            {(status === 'waiting' || status === 'error') && (
              <button
                onClick={handleResendEmail}
                disabled={!canResend || status === 'resending'}
                className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  canResend && status !== 'resending'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {status === 'resending' ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    {resendCooldown > 0 
                      ? `Reenviar em ${resendCooldown}s`
                      : 'Reenviar Email'
                    }
                  </>
                )}
              </button>
            )}

            {/* Botão de Sucesso */}
            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  Redirecionando para a página de planos...
                </p>
              </div>
            )}

            {/* Botão Voltar */}
            {status !== 'checking' && status !== 'success' && (
              <button
                onClick={handleBackToLogin}
                className="w-full flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar ao Login
              </button>
            )}
          </div>

          {/* Instruções */}
          {status === 'waiting' && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Não recebeu o email?</h3>
              <ul className="text-sm text-blue-800 text-left space-y-1">
                <li>• Verifique sua caixa de spam</li>
                <li>• Aguarde alguns minutos</li>
                <li>• Certifique-se de que o email está correto</li>
                <li>• Clique em "Reenviar Email" se necessário</li>
              </ul>
            </div>
          )}
        </div>

        {/* Informações de Suporte */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Problemas com a verificação?{' '}
            <a 
              href="mailto:suporte@ncmpro.com" 
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;