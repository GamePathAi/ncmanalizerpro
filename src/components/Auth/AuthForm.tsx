import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

interface AuthFormProps {
  mode: 'login' | 'register'
  onToggleMode: () => void
  onSuccess?: () => void
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onToggleMode, onSuccess }) => {
  const { signIn, signUp } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

        const { error } = await signUp(formData.email, formData.password)
        
        if (error) {
          throw new Error(error.message)
        }

        setSuccess('Conta criada com sucesso! Enviamos um email de confirmação para ' + formData.email + '. Verifique sua caixa de entrada e clique no link para ativar sua conta.')
        
        // Limpar formulário após sucesso
        setFormData({ email: '', password: '', confirmPassword: '' })
      } else {
        const { error } = await signIn(formData.email, formData.password)
        
        if (error) {
          throw new Error(error.message)
        }

        setSuccess('Login realizado com sucesso!')
        onSuccess?.()
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

  return (
    <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-orange-500/20 rounded-xl shadow-xl p-8 w-full max-w-md">
      <div className="text-center mb-6">
        <div className="bg-orange-500 p-3 rounded-lg inline-block mb-4">
          <User className="text-white" size={24} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {mode === 'login' ? '🔐 Entrar' : '🚗 Criar Conta'}
        </h2>
        <p className="text-gray-400">
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
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full bg-slate-700 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-3 focus:border-orange-500 focus:ring-orange-500/20 focus:outline-none transition-colors"
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full bg-slate-700 border border-gray-600 text-white rounded-lg pl-10 pr-12 py-3 focus:border-orange-500 focus:ring-orange-500/20 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-700 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-3 focus:border-orange-500 focus:ring-orange-500/20 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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

      <div className="mt-6 text-center">
        <p className="text-gray-400">
          {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
        </p>
        <button
          onClick={onToggleMode}
          className="text-orange-400 hover:text-orange-300 font-medium transition-colors mt-1"
        >
          {mode === 'login' ? 'Criar conta gratuita' : 'Fazer login'}
        </button>
      </div>
    </div>
  )
}

export default AuthForm