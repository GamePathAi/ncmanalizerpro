import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PricingPage from '../PricingPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';

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

// Mock do Stripe
const mockStripe = {
  redirectToCheckout: jest.fn()
};

jest.mocked(loadStripe).mockResolvedValue(mockStripe as any);

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

describe('PricingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock usuário com email confirmado mas sem assinatura por padrão
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
  });

  it('deve renderizar os planos de preços', () => {
    renderWithProviders(<PricingPage />);
    
    expect(screen.getByText(/escolha seu plano/i)).toBeInTheDocument();
    expect(screen.getByText(/plano anual/i)).toBeInTheDocument();
    expect(screen.getByText(/plano vitalício/i)).toBeInTheDocument();
  });

  it('deve mostrar preços corretos', () => {
    renderWithProviders(<PricingPage />);
    
    // Verificar se os preços estão sendo exibidos
    expect(screen.getByText(/R\$.*\/ano/)).toBeInTheDocument();
    expect(screen.getByText(/R\$.*pagamento único/)).toBeInTheDocument();
  });

  it('deve mostrar recursos de cada plano', () => {
    renderWithProviders(<PricingPage />);
    
    // Recursos comuns
    expect(screen.getAllByText(/análise completa de ncm/i)).toHaveLength(2);
    expect(screen.getAllByText(/relatórios detalhados/i)).toHaveLength(2);
    expect(screen.getAllByText(/suporte prioritário/i)).toHaveLength(2);
    
    // Recursos exclusivos do vitalício
    expect(screen.getByText(/acesso vitalício/i)).toBeInTheDocument();
    expect(screen.getByText(/sem mensalidades/i)).toBeInTheDocument();
  });

  it('deve iniciar checkout para plano anual', async () => {
    const user = userEvent.setup();
    
    // Mock da criação de sessão de checkout
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { sessionId: 'cs_test_123' },
      error: null
    });
    
    renderWithProviders(<PricingPage />);
    
    const annualButton = screen.getByRole('button', { name: /assinar plano anual/i });
    await user.click(annualButton);
    
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('create-checkout-session', {
      body: { 
        priceId: expect.stringContaining('annual'),
        successUrl: expect.stringContaining('/dashboard'),
        cancelUrl: expect.stringContaining('/pricing')
      }
    });
    
    await waitFor(() => {
      expect(mockStripe.redirectToCheckout).toHaveBeenCalledWith({
        sessionId: 'cs_test_123'
      });
    });
  });

  it('deve iniciar checkout para plano vitalício', async () => {
    const user = userEvent.setup();
    
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { sessionId: 'cs_test_456' },
      error: null
    });
    
    renderWithProviders(<PricingPage />);
    
    const lifetimeButton = screen.getByRole('button', { name: /assinar plano vitalício/i });
    await user.click(lifetimeButton);
    
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('create-checkout-session', {
      body: { 
        priceId: expect.stringContaining('lifetime'),
        successUrl: expect.stringContaining('/dashboard'),
        cancelUrl: expect.stringContaining('/pricing')
      }
    });
    
    await waitFor(() => {
      expect(mockStripe.redirectToCheckout).toHaveBeenCalledWith({
        sessionId: 'cs_test_456'
      });
    });
  });

  it('deve mostrar loading durante criação de checkout', async () => {
    const user = userEvent.setup();
    
    // Mock com delay
    mockSupabase.functions.invoke.mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({ data: { sessionId: 'cs_test_123' }, error: null }), 100)
      )
    );
    
    renderWithProviders(<PricingPage />);
    
    const annualButton = screen.getByRole('button', { name: /assinar plano anual/i });
    await user.click(annualButton);
    
    // Deve mostrar loading
    expect(screen.getByText(/processando/i)).toBeInTheDocument();
    expect(annualButton).toBeDisabled();
    
    // Aguardar conclusão
    await waitFor(() => {
      expect(annualButton).not.toBeDisabled();
    });
  });

  it('deve mostrar erro se checkout falhar', async () => {
    const user = userEvent.setup();
    
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Erro ao criar sessão' }
    });
    
    renderWithProviders(<PricingPage />);
    
    const annualButton = screen.getByRole('button', { name: /assinar plano anual/i });
    await user.click(annualButton);
    
    await waitFor(() => {
      expect(screen.getByText(/erro ao processar pagamento/i)).toBeInTheDocument();
    });
  });

  it('deve redirecionar usuário não autenticado', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });
    
    renderWithProviders(<PricingPage />);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('deve redirecionar usuário com email não confirmado', async () => {
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
    
    renderWithProviders(<PricingPage />);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email');
    });
  });

  it('deve redirecionar usuário com assinatura ativa', async () => {
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { subscription_status: 'active' },
      error: null
    });
    
    renderWithProviders(<PricingPage />);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('deve destacar plano recomendado', () => {
    renderWithProviders(<PricingPage />);
    
    // Plano vitalício deve ser destacado como recomendado
    expect(screen.getByText(/recomendado/i)).toBeInTheDocument();
    
    // Deve ter estilo diferenciado
    const lifetimePlan = screen.getByText(/plano vitalício/i).closest('.plan-card');
    expect(lifetimePlan).toHaveClass('recommended');
  });

  it('deve mostrar comparação de economia', () => {
    renderWithProviders(<PricingPage />);
    
    expect(screen.getByText(/economize.*com o plano vitalício/i)).toBeInTheDocument();
  });

  it('deve ter FAQ sobre os planos', () => {
    renderWithProviders(<PricingPage />);
    
    expect(screen.getByText(/perguntas frequentes/i)).toBeInTheDocument();
    expect(screen.getByText(/posso cancelar a qualquer momento/i)).toBeInTheDocument();
    expect(screen.getByText(/há garantia de reembolso/i)).toBeInTheDocument();
  });

  it('deve mostrar depoimentos de clientes', () => {
    renderWithProviders(<PricingPage />);
    
    expect(screen.getByText(/o que nossos clientes dizem/i)).toBeInTheDocument();
  });

  it('deve ter link para suporte', () => {
    renderWithProviders(<PricingPage />);
    
    const supportLink = screen.getByRole('link', { name: /precisa de ajuda/i });
    expect(supportLink).toBeInTheDocument();
  });

  it('deve lidar com erro do Stripe', async () => {
    const user = userEvent.setup();
    
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { sessionId: 'cs_test_123' },
      error: null
    });
    
    // Mock erro do Stripe
    mockStripe.redirectToCheckout.mockRejectedValue(new Error('Stripe error'));
    
    renderWithProviders(<PricingPage />);
    
    const annualButton = screen.getByRole('button', { name: /assinar plano anual/i });
    await user.click(annualButton);
    
    await waitFor(() => {
      expect(screen.getByText(/erro ao redirecionar para pagamento/i)).toBeInTheDocument();
    });
  });

  it('deve mostrar informações de segurança do pagamento', () => {
    renderWithProviders(<PricingPage />);
    
    expect(screen.getByText(/pagamento seguro/i)).toBeInTheDocument();
    expect(screen.getByText(/processado pelo stripe/i)).toBeInTheDocument();
    expect(screen.getByText(/ssl criptografado/i)).toBeInTheDocument();
  });
});