import { loadStripe } from '@stripe/stripe-js'

// Configuração do Stripe
const stripePublishableKey = 
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY'

export const stripePromise = loadStripe(stripePublishableKey)

// Tipos para o Stripe
export interface StripePrice {
  id: string
  amount: number
  currency: string
  interval?: 'month' | 'year'
  product: string
}

export interface StripeProduct {
  id: string
  name: string
  description: string
  prices: StripePrice[]
}

// Preços dos planos (IDs do Stripe) - ATUALIZADOS COM PRICES RECORRENTES
export const STRIPE_PRICES = {
  BASIC_MONTHLY: import.meta.env.VITE_STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_1S6Cqx0qhrqQ3Ot3vizSWOnH',
  BASIC_YEARLY: import.meta.env.VITE_STRIPE_BASIC_YEARLY_PRICE_ID || 'price_1S67e80qhrqQ3Ot3vnlkAFTK',
  PRO_MONTHLY: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || 'price_1S6Cqy0qhrqQ3Ot3Nt5nwkKR',
  PRO_YEARLY: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID || 'price_1S67e80qhrqQ3Ot3vnlkAFTK',
  ENTERPRISE_MONTHLY: import.meta.env.VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_1S6Cqz0qhrqQ3Ot3oV3Y21wP',
  ENTERPRISE_YEARLY: import.meta.env.VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly'
}

// Configuração dos planos
export const PRICING_PLANS = [
  {
    id: 'monthly',
    name: 'Plano Mensal',
    description: 'Para empresas em crescimento',
    monthlyPrice: 79.90,
    yearlyPrice: 699.90,
    stripePriceIdMonthly: STRIPE_PRICES.PRO_MONTHLY,
    stripePriceIdYearly: STRIPE_PRICES.PRO_YEARLY,
    features: [
      'NCMs ilimitados',
      'Classificação automática avançada',
      'Relatórios avançados',
      'Suporte prioritário',
      'API completa',
      'Integração com ERPs',
      'Histórico completo',
      'Exportação de dados'
    ],
    limitations: [],
    popular: false
  },
  {
    id: 'yearly',
    name: 'Plano Anual',
    description: 'Melhor custo-benefício',
    monthlyPrice: 79.90,
    yearlyPrice: 699.90,
    stripePriceIdMonthly: STRIPE_PRICES.PRO_MONTHLY,
    stripePriceIdYearly: STRIPE_PRICES.PRO_YEARLY,
    features: [
      'Tudo do plano mensal',
      'Economia de R$ 258,90 por ano',
      'NCMs ilimitados',
      'Classificação automática avançada',
      'Relatórios avançados',
      'Suporte prioritário',
      'API completa',
      'Integração com ERPs',
      'Histórico completo',
      'Exportação de dados'
    ],
    limitations: [],
    popular: true
  }
]

// Funções para criar checkout sessions
export const createCheckoutSession = async (priceId: string, userId: string, userEmail: string) => {
  try {
    // Importar supabase aqui para evitar dependência circular
    const { supabase } = await import('./supabase')
    
    // Obter o token de acesso do usuário autenticado
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Usuário não autenticado')
    }
    
    // Usar sempre a URL remota do Supabase
    const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
    
    console.log('🔄 Fazendo requisição para:', `${functionsUrl}/create-checkout-session`)
    console.log('📦 Dados enviados:', { priceId, userId, userEmail })
    console.log('🔑 Usando token de usuário autenticado')
    
    const response = await fetch(`${functionsUrl}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`
      })
    })

    console.log('📡 Status da resposta:', response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Erro da Edge Function:', errorData)
      throw new Error(errorData.error || 'Erro ao criar sessão de checkout')
    }

    const responseData = await response.json()
    console.log('✅ Resposta da Edge Function:', responseData)
    const { sessionId } = responseData
    return sessionId
  } catch (error) {
    console.error('❌ Erro ao criar checkout session:', error)
    throw error
  }
}

// Função para redirecionar para o checkout
export const redirectToCheckout = async (priceId: string, userId: string, userEmail: string) => {
  try {
    console.log('🔄 Iniciando redirectToCheckout com:', { priceId, userId, userEmail })
    
    const stripe = await stripePromise
    if (!stripe) {
      console.error('❌ Stripe não carregado')
      throw new Error('Stripe não carregado')
    }
    console.log('✅ Stripe carregado com sucesso')

    console.log('🔄 Criando sessão de checkout...')
    const sessionId = await createCheckoutSession(priceId, userId, userEmail)
    console.log('✅ Sessão criada com ID:', sessionId)
    
    console.log('🔄 Redirecionando para checkout...')
    const { error } = await stripe.redirectToCheckout({ sessionId })
    
    if (error) {
      console.error('❌ Erro no redirecionamento do Stripe:', error)
      throw error
    }
    
    console.log('✅ Redirecionamento iniciado com sucesso')
  } catch (error) {
    console.error('❌ Erro geral ao redirecionar para checkout:', error)
    throw error
  }
}

// Função para verificar status do pagamento
export const verifyPaymentStatus = async (sessionId: string) => {
  try {
    // Importar supabase aqui para evitar dependência circular
    const { supabase } = await import('./supabase')
    
    // Obter o token de acesso do usuário autenticado
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Usuário não autenticado')
    }
    
    // Usar sempre a URL remota do Supabase
    const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
    
    console.log('🔍 Verificando pagamento em:', `${functionsUrl}/verify-payment?session_id=${sessionId}`)
    
    const response = await fetch(`${functionsUrl}/verify-payment?session_id=${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Erro ao verificar pagamento')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error)
    throw error
  }
}

// Função para cancelar assinatura
export const cancelSubscription = async (subscriptionId: string) => {
  try {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionId })
    })

    if (!response.ok) {
      throw new Error('Erro ao cancelar assinatura')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    throw error
  }
}

// Função para formatar preços
export const formatPrice = (amount: number, currency: string = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100)
}