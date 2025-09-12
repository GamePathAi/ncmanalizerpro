import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EmailVerificationPage from '../EmailVerificationPage';
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
  })),
  functions: {
    invoke: jest.fn()
  }
};

jest.mocked(createClient).mockReturnValue(mockSupabase as any);

// Mock do React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

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

describe('EmailVerificationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock usuário com email não confirmado por padrão
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
  });

  it('deve renderizar a página de verificação de email', () => {
    renderWithProviders(<EmailVerificationPage />);
    
    expect(screen.getByText(/verifique seu email/i)).toBeInTheDocument();
    expect(screen.getByText(/enviamos um link de verificação/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reenviar email/i })).toBeInTheDocument();
  });

  it('deve mostrar o email do usuário na mensagem', async () => {
    renderWithProviders(<EmailVerificationPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });
  });

  it('deve permitir reenviar email de verificação', async () => {
    const user = userEvent.setup();
    
    // Mock da função de reenvio
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { success: true },
      error: null
    });
    
    renderWithProviders(<EmailVerificationPage />);
    
    const resendButton = screen.getByRole('button', { name: /reenviar email/i });
    await user.click(resendButton);
    
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-verification-email', {
      body: { email: 'test@example.com' }
    });
  });

  it('deve mostrar mensagem de sucesso após reenvio', async () => {
    const user = userEvent.setup();
    
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { success: true },
      error: null
    });
    
    renderWithProviders(<EmailVerificationPage />);
    
    const resendButton = screen.getByRole('button', { name: /reenviar email/i });
    await user.click(resendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email reenviado com sucesso/i)).toBeInTheDocument();
    });
  });

  it('deve mostrar mensagem de erro se reenvio falhar', async () => {
    const user = userEvent.setup();
    
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Erro ao enviar email' }
    });
    
    renderWithProviders(<EmailVerificationPage />);
    
    const resendButton = screen.getByRole('button', { name: /reenviar email/i });
    await user.click(resendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/erro ao reenviar email/i)).toBeInTheDocument();
    });
  });

  it('deve desabilitar botão durante o reenvio', async () => {
    const user = userEvent.setup();
    
    // Mock com delay para simular loading
    mockSupabase.functions.invoke.mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({ data: { success: true }, error: null }), 100)
      )
    );
    
    renderWithProviders(<EmailVerificationPage />);
    
    const resendButton = screen.getByRole('button', { name: /reenviar email/i });
    await user.click(resendButton);
    
    // Botão deve estar desabilitado durante o loading
    expect(resendButton).toBeDisabled();
    expect(screen.getByText(/enviando/i)).toBeInTheDocument();
    
    // Aguardar conclusão
    await waitFor(() => {
      expect(resendButton).not.toBeDisabled();
    });
  });

  it('deve implementar rate limiting no reenvio', async () => {
    const user = userEvent.setup();
    
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { success: true },
      error: null
    });
    
    renderWithProviders(<EmailVerificationPage />);
    
    const resendButton = screen.getByRole('button', { name: /reenviar email/i });
    
    // Primeiro clique
    await user.click(resendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email reenviado com sucesso/i)).toBeInTheDocument();
    });
    
    // Segundo clique imediato deve ser bloqueado
    await user.click(resendButton);
    
    expect(screen.getByText(/aguarde.*antes de reenviar/i)).toBeInTheDocument();
  });

  it('deve redirecionar usuário com email já confirmado', async () => {
    // Mock usuário com email confirmado
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
    
    renderWithProviders(<EmailVerificationPage />);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pricing');
    });
  });

  it('deve mostrar instruções claras para o usuário', () => {
    renderWithProviders(<EmailVerificationPage />);
    
    expect(screen.getByText(/verifique sua caixa de entrada/i)).toBeInTheDocument();
    expect(screen.getByText(/clique no link de verificação/i)).toBeInTheDocument();
    expect(screen.getByText(/verifique também a pasta de spam/i)).toBeInTheDocument();
  });

  it('deve ter link para voltar ao login', () => {
    renderWithProviders(<EmailVerificationPage />);
    
    const backToLoginLink = screen.getByRole('link', { name: /voltar ao login/i });
    expect(backToLoginLink).toBeInTheDocument();
    expect(backToLoginLink).toHaveAttribute('href', '/login');
  });

  it('deve lidar com usuário não autenticado', async () => {
    // Mock usuário não autenticado
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });
    
    renderWithProviders(<EmailVerificationPage />);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('deve atualizar automaticamente quando email for confirmado', async () => {
    let authStateCallback: ((event: string, session: any) => void) | null = null;
    
    // Capturar o callback do onAuthStateChange
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
    
    renderWithProviders(<EmailVerificationPage />);
    
    // Simular confirmação de email
    if (authStateCallback) {
      authStateCallback('SIGNED_IN', {
        user: {
          id: '123',
          email: 'test@example.com',
          email_confirmed_at: '2024-01-01T00:00:00Z'
        }
      });
    }
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pricing');
    });
  });
});