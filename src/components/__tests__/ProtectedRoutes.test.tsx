import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from '../ProtectedRoutes';
import { AuthProvider } from '../../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

// Mock do Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }))
};

jest.mocked(createClient).mockReturnValue(mockSupabase as any);

// Mock do React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>
}));

// Componente de teste
const TestComponent = () => <div data-testid="protected-content">Conteúdo Protegido</div>;

// Wrapper com providers necessários
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar conteúdo para usuário autenticado com estado active', async () => {
    // Mock usuário ativo
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
      data: { subscription_status: 'active' },
      error: null
    });

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    // Aguardar o carregamento
    await screen.findByTestId('protected-content');
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('deve redirecionar para verificação de email para usuário pending_email', async () => {
    // Mock usuário com email não confirmado
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          email_confirmed_at: null
        }
      },
      error: null
    });

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    // Deve redirecionar para verificação de email
    await screen.findByTestId('navigate-to');
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/verify-email');
  });

  it('deve redirecionar para pricing para usuário pending_subscription', async () => {
    // Mock usuário com email confirmado mas sem assinatura
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

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    // Deve redirecionar para pricing
    await screen.findByTestId('navigate-to');
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/pricing');
  });

  it('deve redirecionar para login para usuário não autenticado', async () => {
    // Mock usuário não autenticado
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    // Deve redirecionar para login
    await screen.findByTestId('navigate-to');
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login');
  });

  it('deve mostrar loading enquanto verifica autenticação', () => {
    // Mock loading state
    mockSupabase.auth.getUser.mockImplementation(
      () => new Promise(() => {}) // Promise que nunca resolve
    );

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    // Deve mostrar loading
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar conteúdo para usuário admin', async () => {
    // Mock usuário admin
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'admin@example.com',
          email_confirmed_at: '2024-01-01T00:00:00Z',
          user_metadata: { role: 'admin' }
        }
      },
      error: null
    });

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { subscription_status: 'active', role: 'admin' },
      error: null
    });

    renderWithProviders(
      <AdminRoute>
        <TestComponent />
      </AdminRoute>
    );

    // Aguardar o carregamento
    await screen.findByTestId('protected-content');
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('deve redirecionar usuário não-admin para dashboard', async () => {
    // Mock usuário comum
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'user@example.com',
          email_confirmed_at: '2024-01-01T00:00:00Z'
        }
      },
      error: null
    });

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { subscription_status: 'active', role: 'user' },
      error: null
    });

    renderWithProviders(
      <AdminRoute>
        <TestComponent />
      </AdminRoute>
    );

    // Deve redirecionar para dashboard
    await screen.findByTestId('navigate-to');
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/dashboard');
  });

  it('deve redirecionar usuário não autenticado para login', async () => {
    // Mock usuário não autenticado
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });

    renderWithProviders(
      <AdminRoute>
        <TestComponent />
      </AdminRoute>
    );

    // Deve redirecionar para login
    await screen.findByTestId('navigate-to');
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login');
  });
});

// Testes de integração para fluxos completos
describe('Fluxos de Roteamento Integrados', () => {
  it('deve seguir o fluxo completo: não autenticado -> login -> verificação -> pricing -> dashboard', async () => {
    const scenarios = [
      {
        name: 'Usuário não autenticado',
        mockUser: null,
        expectedRedirect: '/login'
      },
      {
        name: 'Usuário com email não confirmado',
        mockUser: {
          id: '123',
          email: 'test@example.com',
          email_confirmed_at: null
        },
        expectedRedirect: '/verify-email'
      },
      {
        name: 'Usuário sem assinatura',
        mockUser: {
          id: '123',
          email: 'test@example.com',
          email_confirmed_at: '2024-01-01T00:00:00Z'
        },
        mockProfile: { subscription_status: 'pending' },
        expectedRedirect: '/pricing'
      },
      {
        name: 'Usuário com acesso completo',
        mockUser: {
          id: '123',
          email: 'test@example.com',
          email_confirmed_at: '2024-01-01T00:00:00Z'
        },
        mockProfile: { subscription_status: 'active' },
        expectContent: true
      }
    ];

    for (const scenario of scenarios) {
      // Setup mocks para cada cenário
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: scenario.mockUser },
        error: null
      });

      if (scenario.mockProfile) {
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: scenario.mockProfile,
          error: null
        });
      }

      const { unmount } = renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      if (scenario.expectContent) {
        await screen.findByTestId('protected-content');
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      } else {
        await screen.findByTestId('navigate-to');
        expect(screen.getByTestId('navigate-to')).toHaveTextContent(scenario.expectedRedirect!);
      }

      unmount();
      jest.clearAllMocks();
    }
  });
});