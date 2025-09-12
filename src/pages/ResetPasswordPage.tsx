import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

interface ResetPasswordPageProps {
  token: string
  onSuccess: () => void
  onBack: () => void
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ token, onSuccess, onBack }) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState('')

  // Verificar se o token é válido ao carregar a página
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/password-recovery/verify-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (data.valid) {
          setTokenValid(true)
          setUserEmail(data.email || '')
        } else {
          setTokenValid(false)
          setError(data.error || 'Token inválido ou expirado')
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error)
        setTokenValid(false)
        setError('Erro ao verificar token')
      }
    }

    if (token) {
      verifyToken()
    } else {
      setTokenValid(false)
      setError('Token não fornecido')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validações
      if (!password) {
        setError('Por favor, insira uma nova senha')
        return
      }

      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        return
      }

      if (password !== confirmPassword) {
        setError('As senhas não coincidem')
        return
      }

      // Chamar API para redefinir senha
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/password-recovery/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha')
      }

      setSuccess(true)
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        onSuccess()
      }, 3000)
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error)
      setError(error.message || 'Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Se token é inválido
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 backdrop-blur-xl border-2 border-red-500/70 hover:border-red-400/90 rounded-2xl shadow-2xl hover:shadow-red-500/40 p-8 w-full max-w-md transition-all duration-300">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-2xl inline-block mb-6 shadow-lg shadow-red-500/40">
              <AlertCircle className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-black mb-3">
              ❌ Token Inválido
            </h2>
            <p className="text-black/80 text-lg font-medium">
              Link expirado ou inválido
            </p>
          </div>

          <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
              <div>
                <p className="text-red-800 font-medium mb-2">
                  {error}
                </p>
                <p className="text-red-700 text-sm">
                  O link pode ter expirado ou já foi utilizado. Solicite um novo link de recuperação.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Solicitar Novo Link
          </button>
        </div>
      </div>
    )
  }

  // Se ainda está verificando o token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 backdrop-blur-xl border-2 border-blue-500/70 rounded-2xl shadow-2xl p-8 w-full max-w-md transition-all duration-300">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-black/80 text-lg font-medium">
              Verificando link de recuperação...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Se senha foi redefinida com sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 backdrop-blur-xl border-2 border-green-500/70 hover:border-green-400/90 rounded-2xl shadow-2xl hover:shadow-green-500/40 p-8 w-full max-w-md transition-all duration-300">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-2xl inline-block mb-6 shadow-lg shadow-green-500/40">
              <CheckCircle className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-black mb-3">
              ✅ Senha Redefinida!
            </h2>
            <p className="text-black/80 text-lg font-medium">
              Sua senha foi alterada com sucesso
            </p>
          </div>

          <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 mt-0.5" size={20} />
              <div>
                <p className="text-green-800 font-medium mb-2">
                  Senha redefinida com sucesso!
                </p>
                <p className="text-green-700 text-sm">
                  Você será redirecionado para a tela de login em alguns segundos...
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onSuccess}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-green-500/40 transition-all duration-300"
          >
            Ir para Login
          </button>
        </div>
      </div>
    )
  }

  // Formulário de redefinição de senha
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 backdrop-blur-xl border-2 border-orange-500/70 hover:border-orange-400/90 rounded-2xl shadow-2xl hover:shadow-orange-500/40 p-8 w-full max-w-md transition-all duration-300">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-2xl inline-block mb-6 shadow-lg shadow-orange-500/40">
            <Lock className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-black mb-3">
            🔐 Nova Senha
          </h2>
          <p className="text-black/80 text-lg font-medium">
            Crie uma nova senha para {userEmail}
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
            <label htmlFor="password" className="block text-black font-semibold mb-2 text-base">
              🔒 Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400" size={20} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-700 border-2 border-orange-500/60 hover:border-orange-400/80 text-white rounded-xl pl-12 pr-12 py-4 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/40 focus:outline-none transition-all duration-200 text-base font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-black font-semibold mb-2 text-base">
              🔒 Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400" size={20} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-slate-700 border-2 border-orange-500/60 hover:border-orange-400/80 text-white rounded-xl pl-12 pr-12 py-4 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/40 focus:outline-none transition-all duration-200 text-base font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">🔐 Dicas para uma senha segura:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Pelo menos 6 caracteres</li>
              <li>• Combine letras, números e símbolos</li>
              <li>• Evite informações pessoais</li>
              <li>• Use uma senha única para esta conta</li>
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
                Redefinindo...
              </>
            ) : (
              <>
                <Lock size={18} />
                Redefinir Senha
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

export default ResetPasswordPage