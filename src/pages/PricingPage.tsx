import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { loadStripe } from '@stripe/stripe-js'

// Inicializar Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!)

interface PricingPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  stripePriceId: string
  features: string[]
  popular?: boolean
  description: string
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'basic-monthly',
    name: 'Básico',
    price: 29.90,
    interval: 'month',
    stripePriceId: 'price_1S6Cqx0qhrqQ3Ot3vizSWOnH', // Novo Price ID recorrente
    description: 'Ideal para pequenas empresas',
    features: [
      'Até 100 NCMs por mês',
      'Classificação automática',
      'Suporte por email',
      'Relatórios básicos',
      'API básica'
    ]
  },
  {
    id: 'pro-monthly',
    name: 'Profissional',
    price: 79.90,
    interval: 'month',
    stripePriceId: 'price_1S6Cqy0qhrqQ3Ot3Nt5nwkKR', // Novo Price ID recorrente
    description: 'Para empresas em crescimento',
    popular: true,
    features: [
      'NCMs ilimitados',
      'Classificação automática avançada',
      'Suporte prioritário',
      'Relatórios avançados',
      'API completa',
      'Integração com ERPs',
      'Histórico completo',
      'Exportação de dados'
    ]
  },
  {
    id: 'enterprise-monthly',
    name: 'Enterprise',
    price: 199.90,
    interval: 'month',
    stripePriceId: 'price_1S6Cqz0qhrqQ3Ot3oV3Y21wP', // Novo Price ID recorrente
    description: 'Para grandes empresas',
    features: [
      'Tudo do plano Profissional',
      'Suporte 24/7',
      'Gerente de conta dedicado',
      'Treinamento personalizado',
      'SLA garantido',
      'Integração customizada',
      'Relatórios personalizados',
      'Auditoria e compliance'
    ]
  }
]

export const PricingPage: React.FC = () => {
  const { user } = useAuth()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      setError('Você precisa fazer login primeiro para assinar um plano')
      return
    }

    setLoadingPlan(plan.id)
    setError(null)

    try {
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Erro ao carregar Stripe')
      }

      // Criar sessão de checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          userId: user.id,
          userEmail: user.email
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao criar sessão de checkout')
      }

      const { sessionId } = await response.json()

      // Redirecionar para o Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
    } catch (error: any) {
      console.error('Erro ao processar assinatura:', error)
      setError(error.message || 'Erro ao processar assinatura')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Escolha seu plano
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Comece a classificar seus NCMs de forma automática e eficiente
          </p>
          {user?.email && (
            <p className="mt-2 text-sm text-gray-500">
              Logado como: <span className="font-medium">{user.email}</span>
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <XMarkIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg shadow-lg divide-y divide-gray-200 ${
                plan.popular
                  ? 'border-2 border-blue-500 bg-white'
                  : 'border border-gray-200 bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-blue-500 text-white">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-base font-medium text-gray-500">/mês</span>
                </p>
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loadingPlan === plan.id}
                  className={`mt-8 w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                      : 'bg-gray-800 hover:bg-gray-900 focus:ring-gray-500'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Processando...
                    </>
                  ) : (
                    'Assinar agora'
                  )}
                </button>
              </div>

              <div className="pt-6 pb-8 px-6">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase">
                  O que está incluído
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex space-x-3">
                      <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-extrabold text-gray-900 text-center mb-8">
              Perguntas Frequentes
            </h3>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Posso cancelar minha assinatura a qualquer momento?
                </h4>
                <p className="text-gray-600">
                  Sim, você pode cancelar sua assinatura a qualquer momento. Não há taxas de cancelamento e você continuará tendo acesso até o final do período pago.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Como funciona o período de teste?
                </h4>
                <p className="text-gray-600">
                  Oferecemos 7 dias de teste gratuito para todos os planos. Você pode explorar todas as funcionalidades sem compromisso.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Posso mudar de plano depois?
                </h4>
                <p className="text-gray-600">
                  Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações serão aplicadas no próximo ciclo de cobrança.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-md">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-green-800">
              Pagamento seguro processado pelo Stripe
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}