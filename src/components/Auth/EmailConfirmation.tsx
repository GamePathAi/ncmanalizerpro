import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, Mail, ArrowRight, Loader } from 'lucide-react'

const EmailConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      
      if (!token || type !== 'signup') {
        setStatus('error')
        setMessage('Link de confirmação inválido ou expirado.')
        return
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        })

        if (error) {
          console.error('Erro na confirmação:', error)
          
          if (error.message.includes('expired')) {
            setStatus('expired')
            setMessage('O link de confirmação expirou. Solicite um novo link.')
          } else {
            setStatus('error')
            setMessage('Erro ao confirmar email. Tente novamente.')
          }
          return
        }

        if (data.user) {
          setStatus('success')
          setMessage('Email confirmado com sucesso! Você já pode fazer login.')
          
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            navigate('/login')
          }, 3000)
        }
      } catch (error) {
        console.error('Erro na confirmação:', error)
        setStatus('error')
        setMessage('Erro inesperado. Tente novamente.')
      }
    }

    confirmEmail()
  }, [searchParams, navigate])

  const handleResendConfirmation = async () => {
    const email = searchParams.get('email')
    if (!email) {
      alert('Email não encontrado. Faça o cadastro novamente.')
      navigate('/register')
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        alert('Erro ao reenviar email. Tente novamente.')
      } else {
        alert('Email de confirmação reenviado! Verifique sua caixa de entrada.')
      }
    } catch (error) {
      alert('Erro inesperado. Tente novamente.')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="animate-spin text-blue-500" size={64} />
      case 'success':
        return <CheckCircle className="text-green-500" size={64} />
      case 'error':
      case 'expired':
        return <XCircle className="text-red-500" size={64} />
      default:
        return <Mail className="text-gray-500" size={64} />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
      case 'expired':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-600 mb-2">
            🚗 NCM Analyzer Pro
          </h1>
        </div>

        {/* Status Icon */}
        <div className="mb-6 flex justify-center">
          {getStatusIcon()}
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'loading' && 'Confirmando email...'}
          {status === 'success' && 'Email confirmado!'}
          {status === 'error' && 'Erro na confirmação'}
          {status === 'expired' && 'Link expirado'}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="space-y-4">
          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  ✅ Sua conta está ativa! Redirecionando para o login...
                </p>
              </div>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Ir para Login
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {(status === 'error' || status === 'expired') && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  {status === 'expired' 
                    ? '⏰ O link de confirmação expirou em 24 horas'
                    : '❌ Não foi possível confirmar seu email'
                  }
                </p>
              </div>
              
              <button
                onClick={handleResendConfirmation}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                Reenviar Email de Confirmação
              </button>
              
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Voltar ao Cadastro
              </button>
            </div>
          )}

          {status === 'loading' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                ⏳ Aguarde enquanto confirmamos seu email...
              </p>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Problemas com a confirmação?
          </p>
          <p className="text-sm text-gray-500">
            Verifique sua caixa de spam ou entre em contato conosco.
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmailConfirmation