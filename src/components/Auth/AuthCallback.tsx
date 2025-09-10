import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Processar tokens do hash da URL (formato do Supabase)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        console.log('Tokens encontrados:', { accessToken: !!accessToken, refreshToken: !!refreshToken })

        if (accessToken && refreshToken) {
          // Definir a sessão com os tokens recebidos
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Erro ao definir sessão:', sessionError)
            setStatus('error')
            setMessage('Erro ao processar confirmação de email.')
            return
          }

          if (data.user) {
            setStatus('success')
            setMessage('Email confirmado com sucesso! Redirecionando para o dashboard...')
            
            // Usar o sistema de navegação customizado da aplicação
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('navigate', { 
                detail: { page: 'dashboard' } 
              }))
            }, 2000)
          } else {
            setStatus('error')
            setMessage('Erro ao processar autenticação.')
          }
        } else {
          // Verificar se já existe uma sessão ativa
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Erro ao verificar sessão:', error)
            setStatus('error')
            setMessage('Erro ao verificar autenticação.')
            return
          }

          if (data.session?.user) {
            setStatus('success')
            setMessage('Você já está logado! Redirecionando...')
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('navigate', { 
                detail: { page: 'dashboard' } 
              }))
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
  }, [])

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

  const handleNavigateToLogin = () => {
    window.dispatchEvent(new CustomEvent('navigate', { 
      detail: { page: 'landing' } 
    }))
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
              onClick={handleNavigateToLogin}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Voltar ao Início
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