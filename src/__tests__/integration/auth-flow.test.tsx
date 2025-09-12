import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoutes';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import EmailVerificationPage from '../../pages/EmailVerificationPage';
import PricingPage from '../../pages/PricingPage';
import UserDashboard from '../../pages/UserDashboard';
import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';

// Mock do Supabase
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  })),
  functions: {
    invoke: jest.fn()
  }
};

jest.mocked(createClient).mockReturnValue(mockSupabase as any);

// Mock do Stripe
const mockStripe = {
  redirectToCheckout: jest.fn()
};

jest.mocked(loadStripe).mockResolvedValue(mockStripe as any);

// Componente de teste que simula a aplicação completa
const TestApp = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Fluxo Completo de Autenticação - Integração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetar para estado inicial (usuário não autenticado)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });
  });

  describe('Fluxo de Registro Completo', () => {
    it('deve completar o fluxo: registro -> verificação -> pricing -> dashboard', async () => {
      const user = userEvent.setup();
      
      // Renderizar aplicação na página de registro
      window.history.pushState({}, 'Register', '/register');
      render(<TestApp />);

      // ETAPA 1: Registro
      expect(screen.getByText(/criar conta/i)).toBeInTheDocument();
      
      // Preencher formulário de registro
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/senha/i), 'password123');
      await user.type(screen.getByLabelText(/nome completo/i), 'Test User');
      
      // Mock do registro bem-sucedido
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            email_confirmed_at: null
          }
        },
        error: null
      });
      
      await user.click(screen.getByRole('button', { name: /criar conta/i }));
      
      // Deve redirecionar para verificação de email
      await waitFor(() => {
        expect(screen.getByText(/verifique seu email/i)).toBeInTheDocument();
      });

      // ETAPA 2: Verificação de Email
      // Simular confirmação de email
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            email_confirmed_at: '2024-01-01T00:00:00Z'
          }
        },
        error: null
      });
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { subscription_status: 'pending' },
        error: null
      });
      
      // Simular mudança de estado de autenticação
      act(() => {
        const callback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];
        callback('SIGNED_IN', {
          user: {
            id: '123',
            email: 'test@example.com',
            email_confirmed_at: '2024-01-01T00:00:00Z'
          }
        });
      });
      
      // Deve redirecionar para pricing
      await waitFor(() => {
        expect(screen.getByText(/escolha seu plano/i)).toBeInTheDocument();
      });

      // ETAPA 3: Seleção de Plano
      // Mock da criação de sessão de checkout
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { sessionId: 'cs_test_123' },
        error: null
      });
      
      await user.click(screen.getByRole('button', { name: /assinar plano anual/i }));
      
      // Deve chamar o Stripe
      await waitFor(() => {
        expect(mockStripe.redirectToCheckout).toHaveBeenCalledWith({
          sessionId: 'cs_test_123'
        });
      });
      
      // ETAPA 4: Simular retorno do Stripe (pagamento bem-sucedido)
      // Atualizar status da assinatura
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { subscription_status: 'active' },
        error: null
      });
      
      // Navegar para dashboard
      window.history.pushState({}, 'Dashboard', '/dashboard');
      render(<TestApp />);
      
      // Deve mostrar o dashboard
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo ao dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Fluxo de Login Existente', () => {
    it('deve fazer login e redirecionar baseado no estado do usuário', async () => {
      const user = userEvent.setup();
      
      // Renderizar na página de login
      window.history.pushState({}, 'Login', '/login');
      render(<TestApp />);
      
      // Preencher formulário de login
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/senha/i), 'password123');
      
      // Mock do login bem-sucedido com usuário ativo
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: '456',
            email: 'existing@example.com',
            email_confirmed_at: '2024-01-01T00:00:00Z'
          }
        },
        error: null
      });
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: '456',
            email: 'existing@example.com',
            email_confirmed_at: '2024-01-01T00:00:00Z'
          }
        },
        error: null
      });
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { subscription_status: 'active' },
        error: null
      });
      
      await user.click(screen.getByRole('button', { name: /entrar/i }));
      
      // Deve redirecionar diretamente para o dashboard
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo ao dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cenários de Erro', () => {
    it('deve lidar com erro de registro', async () => {
      const user = userEvent.setup();
      
      window.history.pushState({}, 'Register', '/register');
      render(<TestApp />);
      
      await user.type(screen.getByLabelText(/email/i), 'invalid@example.com');
      await user.type(screen.getByLabelText(/senha/i), 'weak');
      
      // Mock de erro no registro
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password should be at least 6 characters' }
      });
      
      await user.click(screen.getByRole('button', { name: /criar conta/i }));
      
      // Deve mostrar erro
      await waitFor(() => {
        expect(screen.getByText(/password should be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('deve lidar com erro de login', async () => {
      const user = userEvent.setup();
      
      window.history.pushState({}, 'Login', '/login');
      render(<TestApp />);
      
      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/senha/i), 'wrongpassword');
      
      // Mock de erro no login
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' }
      });
      
      await user.click(screen.getByRole('button', { name: /entrar/i }));
      
      // Deve mostrar erro
      await waitFor(() => {
        expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
      });
    });

    it('deve lidar com erro no checkout', async () => {
      const user = userEvent.setup();
      
      // Setup usuário autenticado sem assinatura
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            email_confirmed_at: '2024-01-01T00:00:00Z'
          }
        },
        error: null
      });
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { subscription_status: 'pending' },
        error: null
      });
      
      window.history.pushState({}, 'Pricing', '/pricing');
      render(<TestApp />);
      
      // Mock de erro na criação de checkout
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Failed to create checkout session' }
      });
      
      await user.click(screen.getByRole('button', { name: /assinar plano anual/i }));
      
      // Deve mostrar erro
      await waitFor(() => {
        expect(screen.getByText(/failed to create checkout session/i)).toBeInTheDocument();
      });
    });
  });

  describe('Proteção de Rotas', () => {
    it('deve bloquear acesso ao dashboard para usuário não autenticado', async () => {
      window.history.pushState({}, 'Dashboard', '/dashboard');
      render(<TestApp />);
      
      // Deve redirecionar para login
      await waitFor(() => {
        expect(screen.getByText(/fazer login/i)).toBeInTheDocument();
      });
    });

    it('deve bloquear acesso ao dashboard para usuário sem assinatura', async () => {
      // Setup usuário autenticado mas sem assinatura
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            email_confirmed_at: '2024-01-01T00:00:00Z'
          }
        },
        error: null
      });
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { subscription_status: 'pending' },
        error: null
      });
      
      window.history.pushState({}, 'Dashboard', '/dashboard');
      render(<TestApp />);
      
      // Deve redirecionar para pricing
      await waitFor(() => {
        expect(screen.getByText(/escolha seu plano/i)).toBeInTheDocument();
      });
    });
  });

  describe('Estados de Loading', () => {
    it('deve mostrar loading durante autenticação', async () => {
      // Mock com delay
      mockSupabase.auth.getUser.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            data: { user: null },
            error: null
          }), 100)
        )
      );
      
      window.history.pushState({}, 'Dashboard', '/dashboard');
      render(<TestApp />);
      
      // Deve mostrar loading
      expect(screen.getByText(/carregando/i)).toBeInTheDocument();
      
      // Aguardar resolução
      await waitFor(() => {
        expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
      });
    });
  });
});