import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface TOTPVerifyProps {
  email: string
  password: string
  onSuccess: () => void
  onCancel: () => void
  onError?: (error: string) => void
}

export const TOTPVerify: React.FC<TOTPVerifyProps> = ({ 
  email, 
  password, 
  onSuccess, 
  onCancel, 
  onError 
}) => {
  const { signIn, validateBackupCode } = useAuth()
  const [totpCode, setTotpCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)

  const handleVerifyTOTP = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setError('Digite um código de 6 dígitos')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const result = await signIn(email, password, totpCode)
      
      if (result.user && !result.error) {
        onSuccess()
      } else {
        const errorMessage = result.error?.message || 'Erro ao fazer login'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'Erro interno do servidor'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyBackupCode = async () => {
    if (!backupCode || backupCode.length < 8) {
      setError('Digite um código de backup válido')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      // Primeiro fazer login básico
      const loginResult = await signIn(email, password)
      
      if (loginResult.user && !loginResult.error) {
        // Depois validar código de backup
        const backupResult = await validateBackupCode(backupCode)
        
        if (backupResult.success) {
          onSuccess()
        } else {
          const errorMessage = backupResult.error || 'Código de backup inválido'
          setError(errorMessage)
          onError?.(errorMessage)
        }
      } else {
        const errorMessage = loginResult.error?.message || 'Erro ao fazer login'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'Erro interno do servidor'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (useBackupCode) {
      handleVerifyBackupCode()
    } else {
      handleVerifyTOTP()
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verificação de Dois Fatores</h2>
        <p className="text-gray-600 text-sm">
          Digite o código de verificação do seu aplicativo autenticador
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Verificando...</p>
        </div>
      )}

      {!loading && (
        <>
          {!useBackupCode ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Verificação
              </label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setTotpCode(value)
                  setError('')
                }}
                placeholder="000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite o código de 6 dígitos do seu aplicativo autenticador.
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Backup
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
                  setBackupCode(value)
                  setError('')
                }}
                placeholder="XXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite um dos códigos de backup que você salvou durante a configuração.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <button
              onClick={() => {
                setUseBackupCode(!useBackupCode)
                setTotpCode('')
                setBackupCode('')
                setError('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {useBackupCode ? 'Usar código do aplicativo' : 'Usar código de backup'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                loading || 
                (!useBackupCode && totpCode.length !== 6) || 
                (useBackupCode && backupCode.length < 8)
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Verificar
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Problemas para acessar? Entre em contato com o suporte.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default TOTPVerify