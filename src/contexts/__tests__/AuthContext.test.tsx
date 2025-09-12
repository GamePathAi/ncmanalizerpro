import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { createClient } from '@supabase/supabase-js';

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
  }))
};

jest.mocked(createClient).mockReturnValue(mockSupabase as any);

// Componente de teste para usar o hook
const TestComponent = () => {
  const { user, userState, login, register, logout, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="user-state">{userState}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('test@example.com', 'password', 'Test User')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o provider sem erros', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('deve inicializar com estado de loading', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('deve chamar signUp ao registrar usuário', async () => {
    const user = userEvent.setup();
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await user.click(screen.getByText('Register'));
    });

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
  });

  it('deve chamar signInWithPassword ao fazer login', async () => {
    const user = userEvent.setup();
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await user.click(screen.getByText('Login'));
    });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });

  it('deve chamar signOut ao fazer logout', async () => {
    const user = userEvent.setup();
    
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await user.click(screen.getByText('Logout'));
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('deve determinar corretamente o estado pending_email', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: null
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-state')).toHaveTextContent('pending_email');
    });
  });

  it('deve determinar corretamente o estado pending_subscription', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z'
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { subscription_status: 'pending' },
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-state')).toHaveTextContent('pending_subscription');
    });
  });

  it('deve determinar corretamente o estado active', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z'
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { subscription_status: 'active' },
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-state')).toHaveTextContent('active');
    });
  });

  it('deve lidar com erros de autenticação', async () => {
    const user = userEvent.setup();
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid credentials' }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await user.click(screen.getByText('Login'));
    });

    // Verificar se o erro foi tratado (usuário continua como null)
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });
});