import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Processar callback de confirmação de email
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro no callback:', error)
          setStatus('error')
          setMessage('Erro ao processar confirmação de email.')
          return
        }

        // Verificar se há parâmetros de confirmação na URL
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')

        if (accessToken && refreshToken && type === 'signup') {
          // Definir a sessão com os tokens recebidos
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Erro ao definir sessão:', sessionError)
            setStatus('error')
            setMessage('Erro ao confirmar email.')
            return
          }

          setStatus('success')
          setMessage('Email confirmado com sucesso! Redirecionando para o dashboard...')
          
          // Redirecionar para dashboard após 2 segundos
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        } else {
          // Se não há parâmetros de confirmação, verificar se já está logado
          if (data.session?.user) {
            setStatus('success')
            setMessage('Você já está logado! Redirecionando...')
            setTimeout(() => {
              navigate('/dashboard')
            }, 1000)
          } else {
            setStatus('error')
            setMessage('Link de confirmação inválido ou expirado.')
          }
        }
      } catch (error) {
        console.error('Erro no callback:', error)
        setStatus('error')
        setMessage('Erro inesperado ao processar confirmação.')
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle size={64} className="text-green-500" />
      case 'error':
        return <XCircle size={64} className="text-red-500" />
      default:
        return <Loader size={64} className="text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-blue-600'
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
          {status === 'loading' && 'Processando...'}
          {status === 'success' && 'Sucesso!'}
          {status === 'error' && 'Erro'}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        {status === 'error' && (
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ir para Login
            </button>
            
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Fazer Novo Cadastro
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              ⏳ Aguarde enquanto processamos sua confirmação...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthCallback