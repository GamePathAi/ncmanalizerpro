import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { redirectToCheckout, STRIPE_PRODUCTS, formatPrice } from '../../lib/stripe'
import { Check, Zap, Crown, AlertCircle } from 'lucide-react'

interface PricingPlansProps {
  onPlanSelect?: (planType: 'annual' | 'lifetime') => void
  onNavigateToCheckout?: (planType: 'annual' | 'lifetime') => void
}

const PricingPlans: React.FC<PricingPlansProps> = ({ onPlanSelect, onNavigateToCheckout }) => {
  const { user, isSubscribed } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handlePlanSelect = async (planType: 'annual' | 'lifetime') => {
    if (!user) {
      setError('Você precisa estar logado para assinar um plano')
      return
    }

    if (isSubscribed) {
      setError('Você já possui uma assinatura ativa')
      return
    }

    setError('')
    
    // Navegar para a página de checkout em vez de redirecionar diretamente
    if (onNavigateToCheckout) {
      onNavigateToCheckout(planType)
    } else {
      // Fallback para o comportamento antigo se onNavigateToCheckout não estiver definido
      setLoading(planType)
      try {
        const product = planType === 'annual' ? STRIPE_PRODUCTS.ANNUAL : STRIPE_PRODUCTS.LIFETIME
        await redirectToCheckout(product.priceId, user.id, user.email!)
        onPlanSelect?.(planType)
      } catch (err: any) {
        console.error('Erro ao processar pagamento:', err)
        setError('Erro ao processar pagamento. Tente novamente.')
      } finally {
        setLoading(null)
      }
    }
  }

  const features = [
    '🔍 Análise completa de NCMs',
    '💰 Identificação de oportunidades de economia',
    '📊 Relatórios detalhados em PDF e TXT',
    '⚡ Processamento rápido de grandes volumes',
    '🎯 Validação com base oficial da RFB',
    '🔧 Especialização em setor automotivo',
    '📈 ROI calculado automaticamente',
    '💾 Exportação de dados em JSON',
    '🛡️ Suporte técnico prioritário',
    '🔄 Atualizações automáticas da base NCM'
  ]

  return (
    <div className="bg-gradient-to-br from-slate-900 to-gray-900 min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-orange-500 p-4 rounded-lg inline-block mb-6">
            <Crown className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            🚗 Escolha Seu Plano NCM Analyzer Pro
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Economize milhares em importações de autopeças com nossa análise especializada de NCMs
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 mb-8 flex items-center gap-3 max-w-2xl mx-auto">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Plano Anual */}
          <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-blue-500/30 rounded-xl shadow-xl p-8 relative">
            <div className="text-center mb-6">
              <div className="bg-blue-500 p-3 rounded-lg inline-block mb-4">
                <Zap className="text-white" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Plano Anual</h3>
              <p className="text-gray-400">Ideal para empresas em crescimento</p>
            </div>

            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {formatPrice(STRIPE_PRODUCTS.ANNUAL.amount)}
              </div>
              <div className="text-gray-400">por ano</div>
              <div className="text-sm text-green-400 mt-1">
                ~{formatPrice(Math.round(STRIPE_PRODUCTS.ANNUAL.amount / 12))}/mês
              </div>
            </div>

            <button
              onClick={() => handlePlanSelect('annual')}
              disabled={loading === 'annual' || isSubscribed}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-6"
            >
              {loading === 'annual' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : isSubscribed ? (
                '✅ Já Assinado'
              ) : (
                '🚀 Assinar Anual'
              )}
            </button>

            <div className="space-y-3">
              {features.slice(0, 8).map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="text-blue-400 flex-shrink-0" size={16} />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plano Vitalício */}
          <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-orange-500/50 rounded-xl shadow-xl p-8 relative">
            {/* Badge de Melhor Valor */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                🏆 MELHOR VALOR
              </div>
            </div>

            <div className="text-center mb-6 mt-4">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-lg inline-block mb-4">
                <Crown className="text-white" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Plano Vitalício</h3>
              <p className="text-gray-400">Acesso completo para sempre</p>
            </div>

            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-orange-400 mb-2">
                {formatPrice(STRIPE_PRODUCTS.LIFETIME.amount)}
              </div>
              <div className="text-gray-400">pagamento único</div>
              <div className="text-sm text-green-400 mt-1">
                Economia de {formatPrice((STRIPE_PRODUCTS.ANNUAL.amount * 10) - STRIPE_PRODUCTS.LIFETIME.amount)} vs 10 anos
              </div>
            </div>

            <button
              onClick={() => handlePlanSelect('lifetime')}
              disabled={loading === 'lifetime' || isSubscribed}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-6"
            >
              {loading === 'lifetime' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : isSubscribed ? (
                '✅ Já Assinado'
              ) : (
                '👑 Assinar Vitalício'
              )}
            </button>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="text-orange-400 flex-shrink-0" size={16} />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Garantia e Segurança */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-slate-800 to-gray-800 border border-green-500/30 rounded-lg p-6 max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-white mb-3">🛡️ Garantia e Segurança</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="text-green-400" size={16} />
                <span>Pagamento 100% seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-400" size={16} />
                <span>Garantia de 30 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-400" size={16} />
                <span>Suporte especializado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingPlans