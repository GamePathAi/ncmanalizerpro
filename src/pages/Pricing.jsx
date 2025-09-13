import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Shield, 
  Users, 
  BarChart3, 
  Headphones,
  CreditCard,
  ArrowRight,
  Loader2
} from 'lucide-react';

const Pricing = () => {
  const { 
    user, 
    loading: authLoading, 
    getUserStatus,
    hasActiveSubscription,
    needsEmailVerification 
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' ou 'yearly'
  const [error, setError] = useState('');

  // Redirecionar se usuário já tem assinatura ativa
  useEffect(() => {
    if (!authLoading && hasActiveSubscription) {
      navigate('/dashboard');
    }
  }, [authLoading, hasActiveSubscription, navigate]);

  // Planos disponíveis
  const plans = {
    starter: {
      name: 'Starter',
      description: 'Perfeito para começar',
      monthlyPrice: 29,
      yearlyPrice: 290, // 2 meses grátis
      stripePriceId: {
        monthly: process.env.REACT_APP_STRIPE_STARTER_MONTHLY_PRICE_ID,
        yearly: process.env.REACT_APP_STRIPE_STARTER_YEARLY_PRICE_ID
      },
      features: [
        'Até 1.000 consultas NCM por mês',
        'Classificação automática',
        'Relatórios básicos',
        'Suporte por email',
        'API básica (100 req/dia)'
      ],
      limitations: [
        'Sem suporte prioritário',
        'Sem relatórios avançados'
      ],
      popular: false,
      color: 'blue'
    },
    professional: {
      name: 'Professional',
      description: 'Para empresas em crescimento',
      monthlyPrice: 79,
      yearlyPrice: 790, // 2 meses grátis
      stripePriceId: {
        monthly: process.env.REACT_APP_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
        yearly: process.env.REACT_APP_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID
      },
      features: [
        'Até 10.000 consultas NCM por mês',
        'Classificação automática avançada',
        'Relatórios detalhados',
        'Suporte prioritário',
        'API avançada (1.000 req/dia)',
        'Integração com sistemas ERP',
        'Dashboard personalizado',
        'Histórico completo'
      ],
      limitations: [],
      popular: true,
      color: 'purple'
    },
    enterprise: {
      name: 'Enterprise',
      description: 'Para grandes operações',
      monthlyPrice: 199,
      yearlyPrice: 1990, // 2 meses grátis
      stripePriceId: {
        monthly: process.env.REACT_APP_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
        yearly: process.env.REACT_APP_STRIPE_ENTERPRISE_YEARLY_PRICE_ID
      },
      features: [
        'Consultas NCM ilimitadas',
        'IA avançada para classificação',
        'Relatórios personalizados',
        'Suporte 24/7 dedicado',
        'API ilimitada',
        'Integração completa',
        'Dashboard white-label',
        'Treinamento da equipe',
        'SLA garantido',
        'Backup e segurança avançados'
      ],
      limitations: [],
      popular: false,
      color: 'gold'
    }
  };

  // Função para criar sessão de checkout do Stripe
  const handleSubscribe = async (planKey) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const userStatus = getUserStatus();
    if (userStatus !== 'pending_subscription') {
      if (userStatus === 'pending_email') {
        setError('Você precisa verificar seu email antes de assinar um plano.');
      } else if (userStatus === 'active') {
        setError('Você já possui uma assinatura ativa.');
      } else {
        setError('Status de usuário inválido para assinatura.');
      }
      return;
    }

    setLoading(true);
    setSelectedPlan(planKey);
    setError('');

    try {
      const plan = plans[planKey];
      const priceId = plan.stripePriceId[billingCycle];

      if (!priceId) {
        throw new Error('Price ID não configurado para este plano');
      }

      // Importar supabase dinamicamente
      const { supabase } = await import('../lib/supabase');
      
      // Obter token de sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Sessão de autenticação não encontrada');
      }

      // Usar Edge Function do Supabase
      const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
      
      const response = await fetch(`${functionsUrl}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout');
      }

      // Redirecionar para o Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }

    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      setError(error.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  // Calcular desconto anual
  const getYearlyDiscount = (plan) => {
    const monthlyTotal = plan.monthlyPrice * 12;
    const yearlyPrice = plan.yearlyPrice;
    const discount = ((monthlyTotal - yearlyPrice) / monthlyTotal * 100).toFixed(0);
    return discount;
  };

  // Formatação de preço
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">NCM PRO</span>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Escolha o plano ideal para
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> seu negócio</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Simplifique a classificação NCM com nossa plataforma inteligente. 
            Economize tempo, reduza erros e mantenha-se sempre em conformidade.
          </p>

          {/* Toggle de Billing */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Mensal
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Anual
            </span>
            {billingCycle === 'yearly' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Economize até 17%
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <X className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {Object.entries(plans).map(([key, plan]) => {
            const currentPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const isLoading = loading && selectedPlan === key;
            
            return (
              <div
                key={key}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                  plan.popular 
                    ? 'border-purple-500 scale-105' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      <Star className="h-4 w-4 mr-1" />
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Header do Plano */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(currentPrice)}
                      </span>
                      <span className="text-gray-600 ml-1">
                        /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                      </span>
                    </div>

                    {billingCycle === 'yearly' && (
                      <div className="text-sm text-green-600 font-medium">
                        Economize {getYearlyDiscount(plan)}% no plano anual
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-8">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(key)}
                    disabled={isLoading || !user || getUserStatus() !== 'pending_subscription'}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <span>Assinar Agora</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  {getUserStatus() !== 'pending_subscription' && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      {needsEmailVerification() 
                        ? 'Verifique seu email primeiro'
                        : 'Você já possui uma assinatura'
                      }
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Por que escolher o NCM PRO?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Classificação Rápida</h3>
              <p className="text-gray-600">IA avançada classifica produtos em segundos</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Seguro</h3>
              <p className="text-gray-600">Dados protegidos com criptografia avançada</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Suporte Especializado</h3>
              <p className="text-gray-600">Equipe de especialistas em comércio exterior</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Relatórios Detalhados</h3>
              <p className="text-gray-600">Análises completas para tomada de decisão</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Dúvidas Frequentes</h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow p-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Posso cancelar a qualquer momento?</h3>
              <p className="text-gray-600">Sim, você pode cancelar sua assinatura a qualquer momento sem taxas adicionais.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Como funciona o período de teste?</h3>
              <p className="text-gray-600">Oferecemos 7 dias grátis para você testar todas as funcionalidades da plataforma.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Posso mudar de plano depois?</h3>
              <p className="text-gray-600">Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;