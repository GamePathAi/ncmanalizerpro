import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import QRCode from 'qrcode'

interface TOTPSetupProps {
  onComplete?: () => void
  onCancel?: () => void
}

export const TOTPSetup: React.FC<TOTPSetupProps> = ({ onComplete, onCancel }) => {
  const { generateTOTPSecret, enableTOTP } = useAuth()
  const [step, setStep] = useState<'generate' | 'verify'>('generate')
  const [secret, setSecret] = useState('')
  const [qrImageUrl, setQrImageUrl] = useState('') // Data URL image
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  useEffect(() => {
    generateSecret()
  }, [])

  const generateSecret = async () => {
    try {
      setLoading(true)
      const result = await generateTOTPSecret()
      setSecret(result.secret)

      // Gerar imagem do QR Code a partir do URI
      const dataUrl = await QRCode.toDataURL(result.qrCodeUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
        width: 200
      })
      setQrImageUrl(dataUrl)
    } catch (error) {
      setError('Erro ao gerar código secreto')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setError('Digite um código de 6 dígitos')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const result = await enableTOTP(totpCode)
      
      if (result.success) {
        setBackupCodes(result.backupCodes || [])
        setStep('verify')
      } else {
        setError(result.error || 'Erro ao verificar código')
      }
    } catch (error) {
      setError('Erro interno do servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    onComplete?.()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (step === 'verify' && backupCodes.length > 0) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">TOTP Configurado com Sucesso!</h2>
          <p className="text-gray-600 text-sm">Salve seus códigos de backup em local seguro</p>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Códigos de Backup</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                  <span>{code}</span>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="text-blue-600 hover:text-blue-800 ml-2"
                    title="Copiar código"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Estes códigos podem ser usados para acessar sua conta se você perder acesso ao seu aplicativo autenticador.
            Cada código só pode ser usado uma vez.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => copyToClipboard(backupCodes.join('\n'))}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Copiar Todos
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Configurar Autenticação de Dois Fatores</h2>
        <p className="text-gray-600 text-sm">Adicione uma camada extra de segurança à sua conta</p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Carregando...</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">1. Escaneie o QR Code</h3>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 text-center">
              {qrImageUrl ? (
                <img src={qrImageUrl} alt="QR Code" className="mx-auto" width={200} height={200} />
              ) : (
                <div className="text-gray-500 text-sm">Gerando QR Code...</div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use um aplicativo como Google Authenticator, Authy ou similar para escanear este código.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">2. Ou digite o código manualmente</h3>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-mono text-center break-all">{secret}</p>
              <button
                onClick={() => copyToClipboard(secret)}
                className="w-full mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Copiar código secreto
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">3. Digite o código de verificação</h3>
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
            />
            <p className="text-xs text-gray-500 mt-1">
              Digite o código de 6 dígitos mostrado no seu aplicativo autenticador.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleVerifyCode}
              disabled={totpCode.length !== 6 || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Verificar
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default TOTPSetup