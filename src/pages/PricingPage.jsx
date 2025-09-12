import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, Shield, Star, X, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const PricingPage = () => {
  const { user, profile, getAccessToken, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verificar parâmetros da URL para feedback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setSuccess('Assinatura realizada com sucesso! Redirecionando para o dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    }
    if (urlParams.get('canceled') === 'true') {
      setError('Pagamento cancelado. Você pode tentar novamente quando quiser.');
    }
  }, [navigate]);

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      price: 29.90,
      period: 'mês',
      description: 'Perfeito para começar',
      icon: Zap,
      popular: false,
      features: [
        'Acesso ao dashboard completo',
        'Análise de até 100 NCMs por mês',
        'Relatórios básicos',
        'Suporte por email',
        'Atualizações automáticas',
        'Histórico de 30 dias'
      ],
      limitations: [
        'Sem API de integração',
        'Sem suporte prioritário'
      ],
      stripePriceId: process.env.REACT_APP_STRIPE_BASIC_PRICE_ID || 'price_basic_monthly'
    },
    {
      id: 'pro',
      name: 'Profissional',
      price: 59.90,
      period: 'mês',
      description: 'Para empresas em crescimento',
      icon: Crown,
      popular: true,
      features: [
        'Tudo do plano Básico',
        'Análise ilimitada de NCMs',
        'Relatórios avançados e personalizados',
        'API de integração completa',
        'Suporte prioritário',
        'Exportação em múltiplos formatos',
        'Histórico completo de análises',
        'Dashboard personalizado'
      ],
      limitations: [],
      stripePriceId: process.env.REACT_APP_STRIPE_PRO_PRICE_ID || 'price_pro_monthly'
    },
    {
      id: 'enterprise',
      name: 'Empresarial',
      price: 149.90,
      period: 'mês',
      description: 'Para grandes operações',
      icon: Shield,
      popular: false,
      features: [
        'Tudo do plano Profissional',
        'Múltiplos usuários (até 10)',
        'Dashboard personalizado avançado',
        'Integração dedicada',
        'Suporte 24/7 com SLA',
        'Treinamento da equipe',
        'Backup e segurança avançada',
        'Relatórios executivos',
        'Consultoria especializada'
      ],
      limitations: [],
      stripePriceId: process.env.REACT_APP_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly'
    }
  ];

  const handleSubscribe = async (plan) => {
    if (!user || !profile) {
      setError('Usuário não autenticado. Faça login para continuar.');
      return;
    }

    if (profile.subscription_status !== 'pending_subscription') {
      setError('Status de usuário inválido para assinatura. Verifique seu email primeiro.');
      return;
    }

    setLoading({ ...loading, [plan.id]: true });
    setError('');
    setSuccess('');

    try {
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error('Token de acesso não encontrado. Faça login novamente.');
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          planId: plan.id,
          planName: plan.name,
          successUrl: `${window.location.origin}/pricing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout');
      }

      // Redirecionar para o Stripe Checkout
      window.location.href = data.url;
      
    } catch (err) {
      console.error('Erro ao processar assinatura:', err);
      setError(err.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading({ ...loading, [plan.id]: false });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Verificar se usuário pode acessar esta página
  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (profile.subscription_status === 'pending_email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Email não verificado</h2>
          <p className="text-gray-600 mb-6">
            Você precisa verificar seu email antes de escolher um plano.
          </p>
          <button
            onClick={() => navigate('/verify-email')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Verificar Email
          </button>
        </div>
      </div>
    );
  }

  if (profile.subscription_status === 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Você já tem uma assinatura ativa!</h2>
          <p className="text-gray-600 mb-6">
            Acesse o dashboard para usar todas as funcionalidades do NCM Pro.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">NCM PRO</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Logado como: <span className="font-medium">{user?.email}</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Desbloqueie todo o potencial da análise de NCMs com nossos planos flexíveis.
            Comece hoje mesmo e transforme sua operação comercial.
          </p>
          
          {profile?.subscription_status === 'pending_subscription' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-8">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-blue-600 mr-2" />
                <p className="text-blue-800 text-sm font-medium">
                  ✅ Seu email foi confirmado! Escolha um plano para continuar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <X className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isLoading = loading[plan.id];
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-blue-500 shadow-xl' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 text-sm font-semibold">
                    ⭐ MAIS POPULAR
                  </div>
                )}
                
                <div className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Icon className={`w-8 h-8 ${plan.popular ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <li key={`limitation-${index}`} className="flex items-start">
                        <X className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500 text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isLoading}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processando...
                      </div>
                    ) : (
                      `Assinar ${plan.name}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Perguntas Frequentes
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Posso cancelar a qualquer momento?</h3>
              <p className="text-gray-600 text-sm">
                Sim! Você pode cancelar sua assinatura a qualquer momento. Não há taxas de cancelamento e você manterá acesso até o final do período pago.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Como funciona o período de teste?</h3>
              <p className="text-gray-600 text-sm">
                Oferecemos 7 dias de teste gratuito em todos os planos. Você pode explorar todas as funcionalidades sem compromisso.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Posso mudar de plano depois?</h3>
              <p className="text-gray-600 text-sm">
                Claro! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças são aplicadas no próximo ciclo de cobrança.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Quais formas de pagamento aceitas?</h3>
              <p className="text-gray-600 text-sm">
                Aceitamos cartões de crédito (Visa, Mastercard, American Express) e PIX. Todos os pagamentos são processados com segurança pelo Stripe.
              </p>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-sm">
            <Shield className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm text-gray-600">
              Pagamentos seguros processados pelo <strong>Stripe</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;