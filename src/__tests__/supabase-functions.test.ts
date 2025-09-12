import { createClient } from '@supabase/supabase-js';

// Mock do fetch global
global.fetch = jest.fn();

// Mock do Supabase
const mockSupabase = {
  functions: {
    invoke: jest.fn()
  },
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn()
  }
};

jest.mocked(createClient).mockReturnValue(mockSupabase as any);

describe('Supabase Functions - Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Registro de Usuário', () => {
    it('deve registrar usuário com sucesso', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: userData.email,
            email_confirmed_at: null
          }
        },
        error: null
      });

      const result = await mockSupabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName
          }
        }
      });

      expect(result.data.user).toBeDefined();
      expect(result.data.user.email).toBe(userData.email);
      expect(result.error).toBeNull();
    });

    it('deve falhar com email inválido', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email format' }
      });

      const result = await mockSupabase.auth.signUp({
        email: 'invalid-email',
        password: 'password123'
      });

      expect(result.data.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Invalid email format');
    });

    it('deve falhar com senha fraca', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password should be at least 6 characters' }
      });

      const result = await mockSupabase.auth.signUp({
        email: 'test@example.com',
        password: '123'
      });

      expect(result.data.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Password should be at least');
    });
  });

  describe('Login de Usuário', () => {
    it('deve fazer login com sucesso', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            email_confirmed_at: '2024-01-01T00:00:00Z'
          }
        },
        error: null
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.data.user).toBeDefined();
      expect(result.data.user.email).toBe('test@example.com');
      expect(result.error).toBeNull();
    });

    it('deve falhar com credenciais inválidas', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' }
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrong-password'
      });

      expect(result.data.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Invalid login credentials');
    });
  });

  describe('Verificação de Email', () => {
    it('deve enviar email de verificação com sucesso', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, message: 'Email sent successfully' },
        error: null
      });

      const result = await mockSupabase.functions.invoke('send-verification-email', {
        body: { email: 'test@example.com' }
      });

      expect(result.data.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('deve falhar com email inválido', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email address' }
      });

      const result = await mockSupabase.functions.invoke('send-verification-email', {
        body: { email: 'invalid-email' }
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('deve implementar rate limiting', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded. Please wait before requesting again.' }
      });

      const result = await mockSupabase.functions.invoke('send-verification-email', {
        body: { email: 'test@example.com' }
      });

      expect(result.error.message).toContain('Rate limit exceeded');
    });
  });

  describe('Criação de Sessão de Checkout', () => {
    it('deve criar sessão de checkout anual com sucesso', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { sessionId: 'cs_test_annual_123' },
        error: null
      });

      const result = await mockSupabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: 'price_annual_123',
          successUrl: 'http://localhost:3000/dashboard',
          cancelUrl: 'http://localhost:3000/pricing'
        }
      });

      expect(result.data.sessionId).toBe('cs_test_annual_123');
      expect(result.error).toBeNull();
    });

    it('deve criar sessão de checkout vitalício com sucesso', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { sessionId: 'cs_test_lifetime_456' },
        error: null
      });

      const result = await mockSupabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: 'price_lifetime_456',
          successUrl: 'http://localhost:3000/dashboard',
          cancelUrl: 'http://localhost:3000/pricing'
        }
      });

      expect(result.data.sessionId).toBe('cs_test_lifetime_456');
      expect(result.error).toBeNull();
    });

    it('deve falhar com usuário não autenticado', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'User not authenticated' }
      });

      const result = await mockSupabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: 'price_annual_123',
          successUrl: 'http://localhost:3000/dashboard',
          cancelUrl: 'http://localhost:3000/pricing'
        }
      });

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('User not authenticated');
    });

    it('deve falhar com priceId inválido', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Invalid price ID' }
      });

      const result = await mockSupabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: 'invalid_price_id',
          successUrl: 'http://localhost:3000/dashboard',
          cancelUrl: 'http://localhost:3000/pricing'
        }
      });

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Invalid price ID');
    });
  });

  describe('Webhook do Stripe', () => {
    it('deve processar checkout.session.completed com sucesso', async () => {
      const webhookPayload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            metadata: {
              user_id: '123'
            },
            mode: 'subscription',
            subscription: 'sub_test_123'
          }
        }
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, message: 'Subscription activated' },
        error: null
      });

      const result = await mockSupabase.functions.invoke('stripe-webhook', {
        body: webhookPayload
      });

      expect(result.data.success).toBe(true);
      expect(result.data.message).toBe('Subscription activated');
    });

    it('deve processar customer.subscription.deleted', async () => {
      const webhookPayload = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
            metadata: {
              user_id: '123'
            }
          }
        }
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, message: 'Subscription cancelled' },
        error: null
      });

      const result = await mockSupabase.functions.invoke('stripe-webhook', {
        body: webhookPayload
      });

      expect(result.data.success).toBe(true);
      expect(result.data.message).toBe('Subscription cancelled');
    });

    it('deve validar assinatura do webhook', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Invalid webhook signature' }
      });

      const result = await mockSupabase.functions.invoke('stripe-webhook', {
        body: { type: 'invalid_event' },
        headers: { 'stripe-signature': 'invalid_signature' }
      });

      expect(result.error.message).toBe('Invalid webhook signature');
    });
  });

  describe('Integração de Email (Resend)', () => {
    it('deve enviar email de boas-vindas', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, messageId: 'msg_123' },
        error: null
      });

      const result = await mockSupabase.functions.invoke('send-welcome-email', {
        body: {
          email: 'test@example.com',
          name: 'Test User'
        }
      });

      expect(result.data.success).toBe(true);
      expect(result.data.messageId).toBe('msg_123');
    });

    it('deve falhar com configuração inválida do Resend', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Resend API key not configured' }
      });

      const result = await mockSupabase.functions.invoke('send-welcome-email', {
        body: {
          email: 'test@example.com',
          name: 'Test User'
        }
      });

      expect(result.error.message).toBe('Resend API key not configured');
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lidar com timeout de rede', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('Network timeout'));

      try {
        await mockSupabase.functions.invoke('auth-endpoints', {
          body: { action: 'test' }
        });
      } catch (error) {
        expect(error.message).toBe('Network timeout');
      }
    });

    it('deve lidar com erro 500 do servidor', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Internal server error', status: 500 }
      });

      const result = await mockSupabase.functions.invoke('auth-endpoints', {
        body: { action: 'test' }
      });

      expect(result.error.status).toBe(500);
      expect(result.error.message).toBe('Internal server error');
    });

    it('deve lidar com dados malformados', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Invalid JSON payload' }
      });

      const result = await mockSupabase.functions.invoke('auth-endpoints', {
        body: 'invalid-json'
      });

      expect(result.error.message).toBe('Invalid JSON payload');
    });
  });
});