import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export const EmailVerificationPage: React.FC = () => {
  const { user, resendVerificationEmail } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)

  const handleResendEmail = async () => {
    if (!user?.email) return

    setIsResending(true)
    setResendMessage(null)
    setResendError(null)

    try {
      await resendVerificationEmail()
      setResendMessage('Email de verificação enviado com sucesso! Verifique sua caixa de entrada.')
    } catch (error: any) {
      setResendError(error.message || 'Erro ao enviar email de verificação')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Confirme seu email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enviamos um link de confirmação para seu email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Verifique sua caixa de entrada
            </h3>
            
            <p className="text-sm text-gray-600 mb-6">
              Enviamos um email de confirmação para{' '}
              <span className="font-medium text-gray-900">{user?.email}</span>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Próximos passos:
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Abra o email que enviamos</li>
                      <li>Clique no link de confirmação</li>
                      <li>Você será redirecionado automaticamente</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagens de feedback */}
            {resendMessage && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{resendMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {resendError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{resendError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botão para reenviar email */}
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Enviando...
                </>
              ) : (
                'Reenviar email de confirmação'
              )}
            </button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Problemas?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Não recebeu o email? Verifique sua pasta de spam ou{' '}
                  <a href="mailto:suporte@ncmpro.com" className="text-blue-600 hover:text-blue-500">
                    entre em contato conosco
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-10">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Por que preciso confirmar meu email?
          </h4>
          <ul className="text-xs text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="flex-shrink-0 h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5 mr-2"></span>
              Garantir a segurança da sua conta
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5 mr-2"></span>
              Receber notificações importantes
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5 mr-2"></span>
              Recuperar sua senha se necessário
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}