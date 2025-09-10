import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Shield, ShieldCheck, ShieldX, Key, RefreshCw, AlertTriangle, CheckCircle, Copy } from 'lucide-react'
import TOTPSetup from './TOTPSetup'

interface TOTPDashboardProps {
  className?: string
}

export const TOTPDashboard: React.FC<TOTPDashboardProps> = ({ className = '' }) => {
  const { userProfile, disableTOTP, regenerateBackupCodes } = useAuth()
  const [showSetup, setShowSetup] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  const isTOTPEnabled = userProfile?.totp_enabled || false

  const handleDisableTOTP = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setError('Digite um código de 6 dígitos')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const result = await disableTOTP(disableCode)
      
      if (result.success) {
        setSuccess('TOTP desabilitado com sucesso!')
        setShowDisableConfirm(false)
        setDisableCode('')
      } else {
        setError(result.error || 'Erro ao desabilitar TOTP')
      }
    } catch (error) {
      setError('Erro interno do servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateBackupCodes = async () => {
    try {
      setLoading(true)
      setError('')
      
      const result = await regenerateBackupCodes()
      
      if (result.success && result.backupCodes) {
        setNewBackupCodes(result.backupCodes)
        setShowBackupCodes(true)
        setSuccess('Novos códigos de backup gerados com sucesso!')
      } else {
        setError(result.error || 'Erro ao gerar códigos de backup')
      }
    } catch (error) {
      setError('Erro interno do servidor')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copiado para a área de transferência!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleSetupComplete = () => {
    setShowSetup(false)
    setSuccess('TOTP configurado com sucesso!')
  }

  // Mostrar componente de configuração se solicitado
  if (showSetup) {
    return (
      <div className={className}>
        <TOTPSetup
          onComplete={handleSetupComplete}
          onCancel={() => setShowSetup(false)}
        />
      </div>
    )
  }

  // Mostrar códigos de backup se gerados
  if (showBackupCodes && newBackupCodes.length > 0) {
    return (
      <div className={`${className} max-w-2xl mx-auto`}>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Novos Códigos de Backup Gerados</h3>
            <p className="text-gray-600 text-sm">Salve estes códigos em local seguro. Os códigos anteriores foram invalidados.</p>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                {newBackupCodes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span>{code}</span>
                    <button
                      onClick={() => copyToClipboard(code)}
                      className="text-blue-600 hover:text-blue-800 ml-2"
                      title="Copiar código"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => copyToClipboard(newBackupCodes.join('\n'))}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Copiar Todos
            </button>
            <button
              onClick={() => {
                setShowBackupCodes(false)
                setNewBackupCodes([])
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isTOTPEnabled ? (
              <ShieldCheck className="w-8 h-8 text-green-600" />
            ) : (
              <ShieldX className="w-8 h-8 text-gray-400" />
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Autenticação de Dois Fatores</h3>
              <p className="text-gray-600 text-sm">
                {isTOTPEnabled 
                  ? 'Sua conta está protegida com TOTP' 
                  : 'Adicione uma camada extra de segurança à sua conta'
                }
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isTOTPEnabled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isTOTPEnabled ? 'Ativo' : 'Inativo'}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-600 text-sm">{success}</span>
          </div>
        )}

        {!isTOTPEnabled ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Por que usar TOTP?</h4>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Protege sua conta mesmo se sua senha for comprometida</li>
                    <li>• Códigos temporários que mudam a cada 30 segundos</li>
                    <li>• Funciona offline com aplicativos como Google Authenticator</li>
                    <li>• Códigos de backup para emergências</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSetup(true)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              Configurar TOTP
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">TOTP Ativo</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Códigos de Backup</h4>
                <p className="text-gray-600 text-sm">Use em caso de emergência</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRegenerateBackupCodes}
                disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Gerar Novos Códigos
              </button>

              <button
                onClick={() => setShowDisableConfirm(true)}
                className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldX className="w-4 h-4" />
                Desabilitar TOTP
              </button>
            </div>
          </div>
        )}

        {/* Modal de confirmação para desabilitar TOTP */}
        {showDisableConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Desabilitar TOTP</h3>
                <p className="text-gray-600 text-sm">Esta ação removerá a proteção de dois fatores da sua conta.</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digite o código TOTP para confirmar
                </label>
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setDisableCode(value)
                    setError('')
                  }}
                  placeholder="000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDisableConfirm(false)
                    setDisableCode('')
                    setError('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDisableTOTP}
                  disabled={disableCode.length !== 6 || loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Desabilitando...' : 'Desabilitar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TOTPDashboard