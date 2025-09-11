import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Verificando sessão:', sessionId)

    // Recuperar dados da sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer']
    })

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Sessão não encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extrair informações da sessão
    const lineItems = session.line_items?.data[0]
    const customer = session.customer as Stripe.Customer
    
    const paymentData = {
      amount: session.amount_total || 0,
      currency: session.currency || 'brl',
      customerEmail: session.customer_email || customer?.email || '',
      customerName: customer?.name || session.customer_details?.name || '',
      planType: lineItems?.price?.recurring?.interval === 'month' ? 'monthly' : 'annual',
      subscriptionId: session.subscription as string,
      invoiceUrl: null, // Pode ser implementado posteriormente
      status: session.payment_status
    }

    console.log('Dados do pagamento:', paymentData)

    return new Response(
      JSON.stringify(paymentData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})