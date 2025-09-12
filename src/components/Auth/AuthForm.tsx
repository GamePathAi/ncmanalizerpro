import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import TOTPVerify from '../TOTPVerify'

interface AuthFormProps {
  mode: 'login' | 'register'
  onToggleMode: () => void
  onSuccess?: () => void
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onToggleMode, onSuccess }) => {
  const { signIn, signUp } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showTOTP, setShowTOTP] = useState(false)
  const [totpCredentials, setTotpCredentials] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('As senhas não coincidem')
        }
        
        if (formData.password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres')
        }

        const { error, user } = await signUp(formData.email, formData.password, formData.name)
        
        if (error) {
          throw new Error(error.message)
        }

        if (user) {
          setSuccess('Conta criada com sucesso! Verifique seu email para confirmar sua conta.')
          
          // Aguardar um momento para mostrar a mensagem
          setTimeout(() => {
            // Redirecionar para página de verificação de email
            window.dispatchEvent(new CustomEvent('navigate', { 
              detail: { page: 'email-verification' } 
            }))
          }, 2000)
        }
        
        // Limpar formulário após sucesso
        setFormData({ name: '', email: '', password: '', confirmPassword: '' })
      } else {
        const { error, user } = await signIn(formData.email, formData.password)
        
        if (error) {
          // Verificar se é erro de TOTP requerido
          if (error.message === 'TOTP_REQUIRED' && error.requiresTOTP) {
            setTotpCredentials({ email: formData.email, password: formData.password })
            setShowTOTP(true)
            return
          }
          
          // Verificar se é erro de assinatura requerida
          if (error.message === 'SUBSCRIPTION_REQUIRED' && error.requiresPayment) {
            setError(error.details || 'Assinatura requerida para acessar o sistema.')
            
            // Redirecionar para página de pagamento após 2 segundos
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('navigate', { 
                detail: { page: 'pricing' } 
              }))
            }, 2000)
            return
          }
          
          throw new Error(error.message)
        }

        if (user) {
          setSuccess('Login realizado com sucesso!')
          onSuccess?.()
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleTOTPSuccess = () => {
    setSuccess('Login realizado com sucesso!')
    setShowTOTP(false)
    onSuccess?.()
  }

  const handleTOTPCancel = () => {
    setShowTOTP(false)
    setTotpCredentials({ email: '', password: '' })
  }

  const handleTOTPError = (error: string) => {
    setError(error)
  }

  // Se estiver mostrando TOTP, renderizar o componente TOTP
  if (showTOTP) {
    return (
      <TOTPVerify
        email={totpCredentials.email}
        password={totpCredentials.password}
        onSuccess={handleTOTPSuccess}
        onCancel={handleTOTPCancel}
        onError={handleTOTPError}
      />
    )
  }

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 backdrop-blur-xl border-2 border-orange-500/70 hover:border-orange-400/90 rounded-2xl shadow-2xl hover:shadow-orange-500/40 p-8 w-full max-w-md transition-all duration-300">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-2xl inline-block mb-6 shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 transition-all duration-300">
          <User className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-black mb-3">
          {mode === 'login' ? '🔐 Entrar' : '🚗 Criar Conta'}
        </h2>
        <p className="text-black/80 text-lg font-medium">
          {mode === 'login' 
            ? 'Acesse sua conta NCM Analyzer Pro' 
            : 'Junte-se ao NCM Analyzer Pro'}
        </p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="text-red-400" size={16} />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
          <CheckCircle className="text-green-400" size={16} />
          <span className="text-green-300 text-sm">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
          <label className="block text-black text-base font-bold mb-3">
            Nome Completo
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400" size={20} />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full bg-slate-700 border-2 border-orange-500/60 hover:border-orange-400/80 text-white rounded-xl pl-12 pr-4 py-4 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/40 focus:outline-none transition-all duration-200 text-base font-medium"
              placeholder="Seu nome completo"
            />
          </div>
        </div>
        )}

        <div>
          <label className="block text-black text-base font-bold mb-3">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400" size={20} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full bg-slate-700 border-2 border-orange-500/60 hover:border-orange-400/80 text-white rounded-xl pl-12 pr-4 py-4 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/40 focus:outline-none transition-all duration-200 text-base font-medium"
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-black text-base font-bold mb-3">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full bg-slate-700 border-2 border-orange-500/60 hover:border-orange-400/80 text-white rounded-xl pl-12 pr-14 py-4 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/40 focus:outline-none transition-all duration-200 text-base font-medium"
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

        {mode === 'register' && (
          <div>
            <label className="block text-black text-base font-bold mb-3">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-700 border-2 border-orange-500/60 hover:border-orange-400/80 text-white rounded-xl pl-12 pr-4 py-4 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/40 focus:outline-none transition-all duration-200 text-base font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2 text-lg transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processando...
            </>
          ) : (
            <>
              {mode === 'login' ? '🔑 Entrar' : '🚀 Criar Conta'}
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        {mode === 'login' && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'forgot-password' } }))}
              className="text-orange-600 hover:text-orange-500 font-medium transition-colors text-sm hover:underline"
            >
              🔑 Esqueci minha senha
            </button>
          </div>
        )}
        
        <p className="text-black/70 text-base font-medium">
          {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
        </p>
        <button
          onClick={onToggleMode}
          className="text-orange-600 hover:text-orange-500 font-bold transition-colors mt-2 text-lg hover:underline"
        >
          {mode === 'login' ? 'Criar conta gratuita' : 'Fazer login'}
        </button>
      </div>
    </div>
  )
}

export default AuthForm