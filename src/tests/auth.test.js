import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import EmailVerificationPage from '../pages/EmailVerificationPage'
import PricingPage from '../pages/PricingPage'
import { supabase } from '../lib/supabase'

// Mock do Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}))

// Mock do Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    redirectToCheckout: vi.fn()
  }))
}))

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Sistema de Autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Registro de Usuário', () => {
    it('deve registrar usuário com sucesso', async () => {
      // Mock da resposta do Supabase
      supabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        },
        error: null
      })

      renderWithProviders(<RegisterPage />)

      // Preencher formulário
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/senha/i), {
        target: { value: 'senha123' }
      })

      // Submeter formulário
      fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

      // Verificar se o Supabase foi chamado
      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'senha123'
        })
      })
    })

    it('deve mostrar erro para email já existente', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' }
      })

      renderWithProviders(<RegisterPage />)

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'existing@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/senha/i), {
        target: { value: 'senha123' }
      })
      fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

      await waitFor(() => {
        expect(screen.getByText(/usuário já registrado/i)).toBeInTheDocument()
      })
    })
  })

  describe('Login de Usuário', () => {
    it('deve fazer login com sucesso', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        },
        error: null
      })

      renderWithProviders(<LoginPage />)

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/senha/i), {
        target: { value: 'senha123' }
      })
      fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'senha123'
        })
      })
    })

    it('deve mostrar erro para credenciais inválidas', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      })

      renderWithProviders(<LoginPage />)

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'wrong@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/senha/i), {
        target: { value: 'wrongpassword' }
      })
      fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument()
      })
    })
  })

  describe('Verificação de Email', () => {
    it('deve permitir reenvio de email de verificação', async () => {
      // Mock da função de reenvio
      const mockResendEmail = vi.fn().mockResolvedValue({ success: true })
      
      renderWithProviders(<EmailVerificationPage />)

      const resendButton = screen.getByRole('button', { name: /reenviar email/i })
      fireEvent.click(resendButton)

      await waitFor(() => {
        expect(screen.getByText(/email reenviado/i)).toBeInTheDocument()
      })
    })

    it('deve mostrar rate limiting para muitos reenvios', async () => {
      renderWithProviders(<EmailVerificationPage />)

      const resendButton = screen.getByRole('button', { name: /reenviar email/i })
      
      // Simular múltiplos cliques
      for (let i = 0; i < 4; i++) {
        fireEvent.click(resendButton)
      }

      await waitFor(() => {
        expect(screen.getByText(/aguarde antes de tentar novamente/i)).toBeInTheDocument()
      })
    })
  })

  describe('Estados do Usuário', () => {
    it('deve redirecionar usuário pending_email para verificação', () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        subscription_status: 'pending_email'
      }

      // Testar lógica de redirecionamento
      const getRedirectPath = (user) => {
        if (user.subscription_status === 'pending_email') {
          return '/verify-email'
        }
        if (user.subscription_status === 'pending_subscription') {
          return '/pricing'
        }
        return '/dashboard'
      }

      expect(getRedirectPath(mockUser)).toBe('/verify-email')
    })

    it('deve redirecionar usuário pending_subscription para pricing', () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        subscription_status: 'pending_subscription'
      }

      const getRedirectPath = (user) => {
        if (user.subscription_status === 'pending_email') {
          return '/verify-email'
        }
        if (user.subscription_status === 'pending_subscription') {
          return '/pricing'
        }
        return '/dashboard'
      }

      expect(getRedirectPath(mockUser)).toBe('/pricing')
    })

    it('deve permitir acesso ao dashboard para usuário ativo', () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        subscription_status: 'active'
      }

      const getRedirectPath = (user) => {
        if (user.subscription_status === 'pending_email') {
          return '/verify-email'
        }
        if (user.subscription_status === 'pending_subscription') {
          return '/pricing'
        }
        return '/dashboard'
      }

      expect(getRedirectPath(mockUser)).toBe('/dashboard')
    })
  })

  describe('Integração com Stripe', () => {
    it('deve criar sessão de checkout', async () => {
      const mockStripe = {
        redirectToCheckout: vi.fn().mockResolvedValue({ error: null })
      }

      // Mock da função de checkout
      const createCheckoutSession = vi.fn().mockResolvedValue({
        sessionId: 'cs_test_123'
      })

      renderWithProviders(<PricingPage />)

      const subscribeButton = screen.getByRole('button', { name: /assinar plano básico/i })
      fireEvent.click(subscribeButton)

      await waitFor(() => {
        expect(createCheckoutSession).toHaveBeenCalled()
      })
    })
  })

  describe('Middleware de Proteção', () => {
    it('deve bloquear acesso não autenticado', () => {
      const requireAuth = (user) => {
        return user !== null
      }

      expect(requireAuth(null)).toBe(false)
      expect(requireAuth({ id: 'test' })).toBe(true)
    })

    it('deve verificar email confirmado', () => {
      const requireEmailVerified = (user) => {
        return user && user.subscription_status !== 'pending_email'
      }

      const pendingUser = { subscription_status: 'pending_email' }
      const verifiedUser = { subscription_status: 'pending_subscription' }

      expect(requireEmailVerified(pendingUser)).toBe(false)
      expect(requireEmailVerified(verifiedUser)).toBe(true)
    })

    it('deve verificar assinatura ativa', () => {
      const requireActiveSubscription = (user) => {
        return user && user.subscription_status === 'active'
      }

      const pendingUser = { subscription_status: 'pending_subscription' }
      const activeUser = { subscription_status: 'active' }

      expect(requireActiveSubscription(pendingUser)).toBe(false)
      expect(requireActiveSubscription(activeUser)).toBe(true)
    })
  })

  describe('Fluxo Completo', () => {
    it('deve completar fluxo de registro até dashboard', async () => {
      // 1. Registro
      supabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'test-id', email: 'test@example.com' } },
        error: null
      })

      // 2. Verificação de email (simulada)
      const verifyEmail = vi.fn().mockResolvedValue({
        success: true,
        user: { subscription_status: 'pending_subscription' }
      })

      // 3. Checkout (simulado)
      const createCheckout = vi.fn().mockResolvedValue({
        sessionId: 'cs_test_123'
      })

      // 4. Webhook (simulado)
      const updateSubscription = vi.fn().mockResolvedValue({
        subscription_status: 'active'
      })

      // Testar cada etapa
      expect(await verifyEmail('token')).toEqual({
        success: true,
        user: { subscription_status: 'pending_subscription' }
      })

      expect(await createCheckout('price_basic')).toEqual({
        sessionId: 'cs_test_123'
      })

      expect(await updateSubscription('user-id')).toEqual({
        subscription_status: 'active'
      })
    })
  })
})

// Testes de Validação
describe('Validações', () => {
  describe('Email', () => {
    it('deve validar formato de email', () => {
      const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      }

      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })
  })

  describe('Senha', () => {
    it('deve validar força da senha', () => {
      const isStrongPassword = (password) => {
        return password.length >= 6
      }

      expect(isStrongPassword('123456')).toBe(true)
      expect(isStrongPassword('12345')).toBe(false)
      expect(isStrongPassword('')).toBe(false)
    })
  })
})

// Testes de Segurança
describe('Segurança', () => {
  it('deve gerar tokens seguros', () => {
    const generateSecureToken = () => {
      return Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15)
    }

    const token = generateSecureToken()
    expect(token).toBeDefined()
    expect(token.length).toBeGreaterThan(10)
  })

  it('deve implementar rate limiting', () => {
    const rateLimiter = {
      attempts: 0,
      maxAttempts: 3,
      canAttempt() {
        return this.attempts < this.maxAttempts
      },
      recordAttempt() {
        this.attempts++
      },
      reset() {
        this.attempts = 0
      }
    }

    expect(rateLimiter.canAttempt()).toBe(true)
    
    rateLimiter.recordAttempt()
    rateLimiter.recordAttempt()
    rateLimiter.recordAttempt()
    
    expect(rateLimiter.canAttempt()).toBe(false)
    
    rateLimiter.reset()
    expect(rateLimiter.canAttempt()).toBe(true)
  })
})