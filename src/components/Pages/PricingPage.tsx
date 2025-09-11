import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { CheckIcon, StarIcon } from '@heroicons/react/24/solid';
import { CrownIcon } from '@heroicons/react/24/outline';
import { stripePromise, PRICING_PLANS } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  features: string[];
  limitations: string[];
  popular: boolean;
}

export const PricingPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (!user) {
      console.error('Usuário não logado');
      return;
    }

    const priceId = isYearly ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
    setLoadingPlan(plan.id);

    try {
      // Criar sessão de checkout usando Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Redirecionar para o Stripe Checkout
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: data.sessionId });
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'auth' } }));
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <CrownIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">NCM Pro</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Logado como: <span className="font-medium">{user?.email}</span>
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu Plano
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Desbloqueie todo o potencial do NCM Pro com nossos planos flexíveis.
            Comece sua jornada profissional hoje mesmo.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-xl p-1 shadow-lg">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                !isYearly
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                isYearly
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <StarIcon className="w-4 h-4" />
                    Mais Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      R$ {(isYearly ? plan.yearlyPrice : plan.monthlyPrice).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-gray-600">/{isYearly ? 'ano' : 'mês'}</span>
                  </div>
                  {isYearly && (
                    <div className="text-sm text-green-600 font-medium">
                      Economize R$ {((plan.monthlyPrice * 12) - plan.yearlyPrice).toFixed(2).replace('.', ',')} por ano
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
                  } ${loadingPlan === plan.id ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {loadingPlan === plan.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    'Assinar Agora'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ/Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Perguntas Frequentes
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Posso cancelar a qualquer momento?
                </h4>
                <p className="text-gray-600 text-sm">
                  Sim, você pode cancelar sua assinatura a qualquer momento sem taxas adicionais.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Há período de teste gratuito?
                </h4>
                <p className="text-gray-600 text-sm">
                  Oferecemos 7 dias de teste gratuito para todos os planos pagos.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Quais formas de pagamento aceitas?
                </h4>
                <p className="text-gray-600 text-sm">
                  Aceitamos cartões de crédito, débito e PIX através do Stripe.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Preciso de ajuda para escolher?
                </h4>
                <p className="text-gray-600 text-sm">
                  Entre em contato conosco em suporte@ncmpro.com para orientação personalizada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};