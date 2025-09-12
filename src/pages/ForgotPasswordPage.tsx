import React, { useState } from 'react'
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Send } from 'lucide-react'

interface ForgotPasswordPageProps {
  onBack: () => void
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validação básica
      if (!email) {
        setError('Por favor, insira seu email')
        return
      }

      if (!email.includes('@')) {
        setError('Por favor, insira um email válido')
        return
      }

      // Chamar função Edge do Supabase
      const response = await fetch('http://127.0.0.1:54321/functions/v1/password-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNx_kzKJGUGpVyMVqBpTHhNkkdMU'}`
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar email de recuperação')
      }

      setSuccess(true)
      setMessage(data.message || 'Email de recuperação enviado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao solicitar recuperação de senha:', error)
      setError(error.message || 'Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 backdrop-blur-xl border-2 border-green-500/70 hover:border-green-400/90 rounded-2xl shadow-2xl hover:shadow-green-500/40 p-8 w-full max-w-md transition-all duration-300">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-2xl inline-block mb-6 shadow-lg shadow-green-500/40">
              <CheckCircle className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-black mb-3">
              ✅ Email Enviado!
            </h2>
            <p className="text-black/80 text-lg font-medium">
              Verifique sua caixa de entrada
            </p>
          </div>

          <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 mt-0.5" size={20} />
              <div>
                <p className="text-green-800 font-medium mb-2">
                  {message}
                </p>
                <p className="text-green-700 text-sm">
                  Enviamos um link para <strong>{email}</strong>. O link expira em 1 hora.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📧 Próximos passos:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Verifique sua caixa de entrada</li>
              <li>• Clique no link "Redefinir Senha"</li>
              <li>• Crie uma nova senha segura</li>
              <li>• Faça login com a nova senha</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Reenviando...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Reenviar Email
                </>
              )}
            </button>

            <button
              onClick={onBack}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 backdrop-blur-xl border-2 border-orange-500/70 hover:border-orange-400/90 rounded-2xl shadow-2xl hover:shadow-orange-500/40 p-8 w-full max-w-md transition-all duration-300">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-2xl inline-block mb-6 shadow-lg shadow-orange-500/40">
            <Mail className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-black mb-3">
            🔑 Esqueci Minha Senha
          </h2>
          <p className="text-black/80 text-lg font-medium">
            Digite seu email para receber o link de recuperação
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-400" size={16} />
            <span className="text-red-200 text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="email" className="block text-black font-semibold mb-2 text-base">
              📧 Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400" size={20} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-700 border-2 border-orange-500/60 hover:border-orange-400/80 text-white rounded-xl pl-12 pr-4 py-4 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/40 focus:outline-none transition-all duration-200 text-base font-medium"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Como funciona:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Enviaremos um link seguro para seu email</li>
              <li>• O link expira em 1 hora por segurança</li>
              <li>• Clique no link para criar uma nova senha</li>
              <li>• Sua senha atual permanece válida até a redefinição</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send size={18} />
                Enviar Link de Recuperação
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={onBack}
            className="text-orange-600 hover:text-orange-500 font-medium transition-colors text-sm hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} />
            Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage