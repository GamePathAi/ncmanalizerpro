import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { cancelSubscription, formatPrice, STRIPE_PRODUCTS } from '../../lib/stripe'
import { User, CreditCard, Calendar, AlertTriangle, LogOut, Settings, BarChart3, Wrench, Users, FileText, TrendingUp, Zap, Shield } from 'lucide-react'
import { WarrantyPolicy } from '../Legal'

const UserDashboard: React.FC = () => {
  const { user } = useAuth()
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    // Profile update functionality removed
  }, [user])

  const handleCancelSubscription = async () => {
    if (!(user as any)?.subscription_id) return
    
    setIsCancelling(true)
    try {
      await cancelSubscription((user as any).subscription_id)
      alert('Assinatura cancelada com sucesso!')
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      alert('Erro ao cancelar assinatura. Tente novamente.')
    } finally {
      setIsCancelling(false)
    }
  }

  const checkSubscriptionStatus = () => {
    if (!(user as any)?.subscription_status) return 'Sem assinatura'
    
    switch ((user as any).subscription_status) {
      case 'active': return 'Ativa'
      case 'canceled': return 'Cancelada'
      case 'past_due': return 'Em atraso'
      case 'unpaid': return 'Não paga'
      default: return (user as any).subscription_status
    }
  }

  const getSubscriptionPrice = () => {
    if (!(user as any)?.subscription_price_id) return 'N/A'
    
    const product = Object.values(STRIPE_PRODUCTS).find((p: any) => p.priceId === (user as any).subscription_price_id)
    return product ? formatPrice(product.amount) : 'N/A'
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bem-vindo, {(user as any).full_name || user.email}!</h1>
              <p className="text-orange-100">Gerencie sua conta e acesse todas as funcionalidades do NCM Pro</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{checkSubscriptionStatus()}</div>
                <div className="text-sm text-orange-100">Status da assinatura</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="bg-slate-800 rounded-xl p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeSection === 'overview'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveSection('tools')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeSection === 'tools'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              Ferramentas
            </button>
            <button
              onClick={() => setActiveSection('community')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeSection === 'community'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              Comunidade
            </button>
            <button
              onClick={() => setActiveSection('warranty')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeSection === 'warranty'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              Garantias
            </button>
            <button
              onClick={() => setActiveSection('account')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeSection === 'account'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              Conta
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {(user as any).subscription_status === 'canceled' && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-200">
              <AlertTriangle size={20} />
              <span>Sua assinatura foi cancelada e expirará em breve.</span>
            </div>
          </div>
        )}

        {(user as any).subscription_status === 'past_due' && (
          <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-yellow-200">
              <AlertTriangle size={20} />
              <span>Sua assinatura está em atraso. Atualize seu método de pagamento.</span>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-blue-200">Análises este mês</div>
              </div>
              <BarChart3 size={32} className="text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">R$ 45.2k</div>
                <div className="text-green-200">Economia total</div>
              </div>
              <TrendingUp size={32} className="text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">89%</div>
                <div className="text-purple-200">Taxa de sucesso</div>
              </div>
              <Shield size={32} className="text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">156</div>
                <div className="text-orange-200">NCMs analisados</div>
              </div>
              <FileText size={32} className="text-orange-200" />
            </div>
          </div>
        </div>

        {/* Seção de Ferramentas NCM */}
        {(activeSection === 'overview' || activeSection === 'tools') && (
          <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-orange-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-500 p-3 rounded-lg">
                <Wrench className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-white">🔧 Ferramentas NCM</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'analyzer' } }))}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText size={24} />
                  <span className="font-medium">Analisador NCM</span>
                  <span className="text-xs text-blue-200">Análise completa de classificações</span>
                </div>
              </button>
              
              <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                <div className="flex flex-col items-center gap-2">
                  <TrendingUp size={24} />
                  <span className="font-medium">Relatórios</span>
                  <span className="text-xs text-green-200">Histórico de análises</span>
                </div>
              </button>
              
              <button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                <div className="flex flex-col items-center gap-2">
                  <Zap size={24} />
                  <span className="font-medium">Automação</span>
                  <span className="text-xs text-purple-200">Análises automáticas</span>
                </div>
              </button>
            </div>
            
            {/* Estatísticas de Uso das Ferramentas */}
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">12</div>
                <div className="text-sm text-gray-400">Análises este mês</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">R$ 45.2k</div>
                <div className="text-sm text-gray-400">Economia identificada</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-orange-400">89%</div>
                <div className="text-sm text-gray-400">Taxa de sucesso</div>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Comunidade */}
        {(activeSection === 'overview' || activeSection === 'community') && (
          <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-blue-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-white">🤝 Comunidade NCM Pro</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Conecte-se com especialistas</h3>
                <ul className="space-y-2 text-gray-300 mb-4">
                  <li className="flex items-center gap-2">
                    <Shield size={16} className="text-green-400" />
                    <span>Advogados tributaristas especializados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users size={16} className="text-blue-400" />
                    <span>Importadores experientes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText size={16} className="text-purple-400" />
                    <span>Cases de sucesso reais</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-orange-400" />
                    <span>Tendências do mercado</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex flex-col justify-center">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg mb-4">
                  <div className="flex items-center justify-center gap-3">
                    <Users size={20} />
                    <span className="font-medium">Entrar na Comunidade</span>
                  </div>
                </button>
                
                <div className="text-center text-sm text-gray-400">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <span>👥 1.2k+ membros</span>
                    <span>💬 Discussões ativas</span>
                  </div>
                  <span>📈 +150 cases de economia compartilhados</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Conta */}
        {(activeSection === 'overview' || activeSection === 'account') && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Informações da Assinatura */}
            <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="text-blue-400" size={20} />
                <h2 className="text-xl font-semibold text-white">Assinatura</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${
                    (user as any).subscription_status === 'active' ? 'text-green-400' :
                    (user as any).subscription_status === 'canceled' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {checkSubscriptionStatus()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Plano:</span>
                  <span className="text-white font-medium">{getSubscriptionPrice()}/mês</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Próxima cobrança:</span>
                  <span className="text-white">{formatDate((user as any).subscription_current_period_end)}</span>
                </div>
              </div>
            </div>

            {/* Estatísticas de Uso */}
            <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="text-green-400" size={20} />
                <h2 className="text-xl font-semibold text-white">Estatísticas</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Análises realizadas:</span>
                  <span className="text-white font-medium">156</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Economia total:</span>
                  <span className="text-green-400 font-medium">R$ 45.234,50</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Taxa de sucesso:</span>
                  <span className="text-blue-400 font-medium">89%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informações do Usuário */}
        {(activeSection === 'overview' || activeSection === 'account') && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="text-purple-400" size={20} />
                <h2 className="text-xl font-semibold text-white">Informações da Conta</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Membro desde:</span>
                  <span className="text-white">{formatDate(user.created_at || null)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Última atualização:</span>
                  <span className="text-white">{formatDate(user.updated_at || null)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Análises realizadas:</span>
                  <span className="text-white">156</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Economia total:</span>
                  <span className="text-green-400">R$ 45.234,50</span>
                </div>
              </div>
            </div>

            {/* Ações da Conta */}
            <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-orange-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="text-orange-400" size={20} />
                <h2 className="text-xl font-semibold text-white">Ações da Conta</h2>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setIsUpdatingProfile(!isUpdatingProfile)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <User size={16} />
                  Atualizar Perfil
                </button>
                
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                  <CreditCard size={16} />
                  Histórico de Pagamentos
                </button>
                
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                  <Calendar size={16} />
                  Agendar Consultoria
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zona de Perigo */}
        {(activeSection === 'overview' || activeSection === 'account') && (
          <div className="bg-gradient-to-br from-red-900/50 to-red-800/50 border border-red-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-400" size={20} />
              <h2 className="text-xl font-semibold text-white">Zona de Perigo</h2>
            </div>
            
            <p className="text-gray-300 mb-4">
              Cancelar sua assinatura removerá o acesso a todas as funcionalidades premium.
            </p>
            
            {(user as any).subscription_status === 'active' && (
              <div className="flex gap-4">
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isCancelling ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <LogOut size={16} />
                  )}
                  {isCancelling ? 'Cancelando...' : 'Cancelar Assinatura'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Seção de Garantias */}
        {activeSection === 'warranty' && (
          <div className="mt-8">
            <WarrantyPolicy />
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard