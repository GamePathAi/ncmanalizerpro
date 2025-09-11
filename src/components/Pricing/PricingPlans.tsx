import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { PRICING_PLANS, formatPrice } from '../../lib/stripe'
import { Check, Zap, Crown, AlertCircle } from 'lucide-react'

interface PricingPlansProps {
  onNavigateToCheckout?: (planType: 'monthly' | 'annual') => void
}

const PricingPlans: React.FC<PricingPlansProps> = ({ onNavigateToCheckout }) => {
  const { user, isSubscribed } = useAuth()
  const [loading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handlePlanSelect = async (planType: 'monthly' | 'annual') => {
    // Permitir checkout para usuários autenticados (pending_subscription) ou não autenticados
    if (!user) {
      setError('Você precisa estar logado para assinar um plano')
      return
    }

    if (isSubscribed) {
      setError('Você já possui uma assinatura ativa')
      return
    }

    setError('')
    
    // Navegar para a página de checkout usando navegação interna
    if (onNavigateToCheckout) {
      onNavigateToCheckout(planType)
    } else {
      // Usar navegação interna como fallback
      localStorage.setItem('selectedPlan', planType)
      window.dispatchEvent(new CustomEvent('navigate', { 
        detail: { page: 'checkout' } 
      }))
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
    <div className="bg-gradient-to-br from-gray-950 via-black to-gray-950 min-h-screen py-16 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900/40 via-black/60 to-gray-950/80"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/3 to-orange-500/3 rounded-full blur-3xl"></div>
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-5 rounded-2xl inline-block mb-8 shadow-2xl shadow-orange-500/25">
            <Crown className="text-white" size={40} />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-orange-100 mb-6 leading-tight">
            🚗 Escolha Seu Plano
            <br />
            <span className="text-4xl md:text-5xl bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
              NCM Analyzer Pro
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Economize <span className="text-green-400 font-bold">milhares de reais</span> em importações de autopeças com nossa análise especializada de NCMs
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 mb-8 flex items-center gap-3 max-w-2xl mx-auto">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {/* Plano Mensal */}
          <div className="group relative bg-gradient-to-br from-white/98 via-gray-50/98 to-white/98 backdrop-blur-xl border-4 border-blue-500/80 hover:border-blue-400/90 rounded-3xl shadow-2xl hover:shadow-blue-500/40 p-8 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-300/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-2xl inline-block mb-6 shadow-lg shadow-blue-500/25">
                  <Zap className="text-white" size={28} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Plano Mensal</h3>
                <p className="text-gray-700 text-lg">Ideal para testes e uso pontual</p>
              </div>

              <div className="text-center mb-8">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-3">
                  {formatPrice(PRICING_PLANS[1].monthlyPrice * 100)}
                </div>
                <div className="text-gray-600 text-lg mb-2">por mês</div>
                <div className="inline-block bg-blue-500/30 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                  Acesso por 1 mês
                </div>
              </div>

              <button
                onClick={() => handlePlanSelect('monthly')}
                disabled={loading === 'monthly' || isSubscribed}
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 mb-8 shadow-lg hover:shadow-blue-500/25 hover:scale-105 text-lg"
              >
                {loading === 'monthly' ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : isSubscribed ? (
                  '✅ Já Assinado'
                ) : (
                  <>
                    <Zap size={20} />
                    Assinar Mensal
                  </>
                )}
              </button>

              <div className="space-y-4">
                {features.slice(0, 8).map((feature, index) => (
                  <div key={index} className="flex items-center gap-4 p-2 rounded-lg hover:bg-blue-500/5 transition-colors">
                    <div className="bg-blue-500/20 p-1 rounded-full">
                      <Check className="text-blue-400 flex-shrink-0" size={16} />
                    </div>
                    <span className="text-gray-800 text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plano Anual */}
          <div className="group relative bg-gradient-to-br from-white/98 via-orange-50/98 to-white/98 backdrop-blur-xl border-4 border-orange-500/80 hover:border-orange-400/90 rounded-3xl shadow-2xl hover:shadow-orange-500/40 p-8 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
            {/* Best Value Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                🔥 MELHOR VALOR
              </div>
            </div>
            
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-300/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10 pt-4">
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-2xl inline-block mb-6 shadow-lg shadow-orange-500/25">
                  <Crown className="text-white" size={28} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Plano Anual</h3>
                <p className="text-gray-700 text-lg">Pagamento único por ano</p>
              </div>

              <div className="text-center mb-8">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-3">
                  {formatPrice(PRICING_PLANS[1].yearlyPrice * 100)}
                </div>
                <div className="text-gray-600 text-lg mb-2">pagamento único</div>
                <div className="inline-block bg-green-500/30 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                  Economia de {formatPrice((PRICING_PLANS[1].monthlyPrice * 12 * 100) - (PRICING_PLANS[1].yearlyPrice * 100))} vs mensal
                </div>
              </div>

              <button
                onClick={() => handlePlanSelect('annual')}
                disabled={loading === 'annual' || isSubscribed}
                className="w-full bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 hover:from-orange-700 hover:via-red-700 hover:to-orange-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 mb-8 shadow-lg hover:shadow-orange-500/25 hover:scale-105 text-lg"
              >
                {loading === 'annual' ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : isSubscribed ? (
                  '✅ Já Assinado'
                ) : (
                  <>
                    <Crown size={20} />
                    Assinar Anual
                  </>
                )}
              </button>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-4 p-2 rounded-lg hover:bg-orange-500/10 transition-colors">
                    <div className="bg-orange-500/30 p-1 rounded-full">
                      <Check className="text-orange-600 flex-shrink-0" size={16} />
                    </div>
                    <span className="text-gray-800 text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Garantia e Segurança */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-white/95 to-gray-50/95 border-2 border-green-500/60 rounded-lg p-6 max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">🛡️ Garantia e Segurança</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Check className="text-green-600" size={16} />
                <span>Pagamento 100% seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-600" size={16} />
                <span>Garantia de 30 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-600" size={16} />
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