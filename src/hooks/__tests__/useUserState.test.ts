import { renderHook, waitFor } from '@testing-library/react';
import { useUserState } from '../useUserState';
import { createClient } from '@supabase/supabase-js';

// Mock do Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }))
};

jest.mocked(createClient).mockReturnValue(mockSupabase as any);

describe('useUserState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar pending_email para usuário sem email confirmado', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: null
    };

    const { result } = renderHook(() => useUserState(mockUser));

    await waitFor(() => {
      expect(result.current.userState).toBe('pending_email');
      expect(result.current.needsEmailVerification).toBe(true);
      expect(result.current.canAccessDashboard).toBe(false);
    });
  });

  it('deve retornar pending_subscription para usuário com email confirmado mas sem assinatura', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z'
    };

    // Mock da consulta ao perfil do usuário
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { subscription_status: 'pending' },
      error: null
    });

    const { result } = renderHook(() => useUserState(mockUser));

    await waitFor(() => {
      expect(result.current.userState).toBe('pending_subscription');
      expect(result.current.needsEmailVerification).toBe(false);
      expect(result.current.canAccessDashboard).toBe(false);
    });
  });

  it('deve retornar active para usuário com email confirmado e assinatura ativa', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z'
    };

    // Mock da consulta ao perfil do usuário
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { subscription_status: 'active' },
      error: null
    });

    const { result } = renderHook(() => useUserState(mockUser));

    await waitFor(() => {
      expect(result.current.userState).toBe('active');
      expect(result.current.needsEmailVerification).toBe(false);
      expect(result.current.canAccessDashboard).toBe(true);
    });
  });

  it('deve criar perfil do usuário se não existir', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
      user_metadata: { full_name: 'Test User' }
    };

    // Mock: primeiro retorna erro (perfil não existe), depois sucesso após criação
    mockSupabase.from().select().eq().single
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Erro de "not found"
      })
      .mockResolvedValueOnce({
        data: { subscription_status: 'pending' },
        error: null
      });

    // Mock da inserção do perfil
    mockSupabase.from().insert.mockResolvedValue({
      data: [{ id: '123', subscription_status: 'pending' }],
      error: null
    });

    const { result } = renderHook(() => useUserState(mockUser));

    await waitFor(() => {
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        subscription_status: 'pending'
      });
    });

    await waitFor(() => {
      expect(result.current.userState).toBe('pending_subscription');
    });
  });

  it('deve atualizar status baseado na confirmação de email', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z'
    };

    // Mock da consulta inicial
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { subscription_status: 'pending_email' },
      error: null
    });

    // Mock da atualização
    mockSupabase.from().update().eq().mockResolvedValue({
      data: [{ subscription_status: 'pending_subscription' }],
      error: null
    });

    const { result } = renderHook(() => useUserState(mockUser));

    await waitFor(() => {
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        subscription_status: 'pending_subscription'
      });
    });
  });

  it('deve lidar com usuário null', () => {
    const { result } = renderHook(() => useUserState(null));

    expect(result.current.userState).toBe('pending_email');
    expect(result.current.needsEmailVerification).toBe(true);
    expect(result.current.canAccessDashboard).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('deve lidar com erros na consulta do perfil', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z'
    };

    // Mock de erro na consulta
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    });

    const { result } = renderHook(() => useUserState(mockUser));

    await waitFor(() => {
      expect(result.current.userState).toBe('pending_email');
      expect(result.current.loading).toBe(false);
    });
  });

  it('deve retornar métodos de atualização corretos', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z'
    };

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { subscription_status: 'active' },
      error: null
    });

    const { result } = renderHook(() => useUserState(mockUser));

    await waitFor(() => {
      expect(typeof result.current.updateSubscriptionStatus).toBe('function');
      expect(typeof result.current.refreshUserState).toBe('function');
    });

    // Testar updateSubscriptionStatus
    mockSupabase.from().update().eq().mockResolvedValue({
      data: [{ subscription_status: 'active' }],
      error: null
    });

    await result.current.updateSubscriptionStatus('active');

    expect(mockSupabase.from().update).toHaveBeenCalledWith({
      subscription_status: 'active'
    });
  });

  it('deve gerenciar estado de loading corretamente', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z'
    };

    // Simular delay na resposta
    mockSupabase.from().select().eq().single.mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({
          data: { subscription_status: 'active' },
          error: null
        }), 100)
      )
    );

    const { result } = renderHook(() => useUserState(mockUser));

    // Inicialmente deve estar loading
    expect(result.current.loading).toBe(true);

    // Após resolver, não deve estar mais loading
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});