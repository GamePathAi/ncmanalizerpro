import { loadStripe } from '@stripe/stripe-js'

// Substitua pela sua chave pública do Stripe
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY'

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

// Configuração dos produtos/preços
export const STRIPE_PRODUCTS = {
  ANNUAL: {
    priceId: 'price_annual_ncm_pro', // Substitua pelo ID real do Stripe
    amount: 24700, // R$ 247,00 em centavos
    currency: 'brl',
    interval: 'year' as const,
    name: 'NCM Analyzer Pro - Anual',
    description: 'Acesso completo por 1 ano'
  },
  LIFETIME: {
    priceId: 'price_lifetime_ncm_pro', // Substitua pelo ID real do Stripe
    amount: 199700, // R$ 1.997,00 em centavos
    currency: 'brl',
    name: 'NCM Analyzer Pro - Vitalício',
    description: 'Acesso completo vitalício'
  }
}

// Funções para criar checkout sessions
export const createCheckoutSession = async (priceId: string, userId: string, userEmail: string) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`
      })
    })

    if (!response.ok) {
      throw new Error('Erro ao criar sessão de checkout')
    }

    const { sessionId } = await response.json()
    return sessionId
  } catch (error) {
    console.error('Erro ao criar checkout session:', error)
    throw error
  }
}

// Função para redirecionar para o checkout
export const redirectToCheckout = async (priceId: string, userId: string, userEmail: string) => {
  try {
    const stripe = await stripePromise
    if (!stripe) throw new Error('Stripe não carregado')

    const sessionId = await createCheckoutSession(priceId, userId, userEmail)
    
    const { error } = await stripe.redirectToCheckout({ sessionId })
    
    if (error) {
      console.error('Erro no redirecionamento:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro ao redirecionar para checkout:', error)
    throw error
  }
}

// Função para verificar status do pagamento
export const verifyPaymentStatus = async (sessionId: string) => {
  try {
    const response = await fetch(`/api/verify-payment?session_id=${sessionId}`)
    
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