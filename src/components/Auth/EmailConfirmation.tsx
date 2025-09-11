import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, Mail, ArrowRight, Loader } from 'lucide-react'

const EmailConfirmation: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')

  // Função para navegar usando o sistema customizado
  const navigateToPage = (page: string) => {
    const event = new CustomEvent('navigate', { detail: { page } })
    window.dispatchEvent(event)
  }

  // Função para obter parâmetros da URL
  const getUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return {
      token: urlParams.get('token'),
      type: urlParams.get('type')
    }
  }

  useEffect(() => {
    const confirmEmail = async () => {
      const { token, type } = getUrlParams()
      
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
          
          // Redirecionar para dashboard após 3 segundos
          setTimeout(() => {
            navigateToPage('dashboard')
          }, 3000)
        }
      } catch (error) {
        console.error('Erro inesperado:', error)
        setStatus('error')
        setMessage('Erro inesperado. Tente novamente mais tarde.')
      }
    }

    confirmEmail()
  }, [])

  const handleResendConfirmation = async () => {
    const { token } = getUrlParams()
    
    if (!token) {
      setMessage('Token não encontrado. Faça login novamente para receber um novo email.')
      return
    }

    try {
      // Aqui você pode implementar a lógica para reenviar o email
      setMessage('Novo email de confirmação enviado!')
    } catch (error) {
      setMessage('Erro ao reenviar email. Tente novamente.')
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirmando seu email...</h2>
            <p className="text-gray-600">Por favor, aguarde enquanto verificamos sua confirmação.</p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Confirmado!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigateToPage('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              Ir para Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )

      case 'expired':
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Link Expirado</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleResendConfirmation}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                <Mail className="w-4 h-4" />
                Reenviar Email
              </button>
              <button
                onClick={() => navigateToPage('landing')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        )

      case 'error':
      default:
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro na Confirmação</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => navigateToPage('landing')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Confirmação de Email</h1>
        </div>
        
        {renderContent()}
        
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Precisa de ajuda? Entre em contato com nosso suporte.
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmailConfirmation