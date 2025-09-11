import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthForm from './AuthForm'
import PricingPlans from '../Pricing/PricingPlans'
import { Lock, Crown, AlertCircle, Mail } from 'lucide-react'

interface SubscriptionGuardProps {
  children: React.ReactNode
  requireSubscription?: boolean
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ 
  children, 
  requireSubscription = true 
}) => {
  const { user, userProfile, loading, userState } = useAuth()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-orange-500 p-4 rounded-lg inline-block mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">🚗 Carregando NCM Analyzer</h2>
          <p className="text-gray-400">Verificando suas credenciais...</p>
        </div>
      </div>
    )
  }

  // Renderizar baseado no estado do usuário
  switch (userState) {
    case 'pending_email':
      return (
        <div className="bg-gradient-to-br from-slate-900 to-gray-900 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <div className="bg-blue-500 p-4 rounded-lg inline-block mb-4">
                <Mail className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">📧 Confirme seu Email</h1>
              <p className="text-gray-300 max-w-2xl mx-auto">
                {user ? 
                  `Enviamos um link de confirmação para ${user.email}. Clique no link para ativar sua conta.` :
                  'Para usar o NCM Analyzer Pro, você precisa estar logado.'
                }
              </p>
            </div>
            {!user && <AuthForm mode="login" onToggleMode={() => {}} />}
          </div>
        </div>
      )

    case 'pending_subscription':
      // Se não precisa de assinatura, liberar acesso
      if (!requireSubscription) {
        return <>{children}</>
      }
      
      return (
        <div className="bg-gradient-to-br from-slate-900 to-gray-900 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-lg inline-block mb-4">
                <Crown className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">🚗 Assinatura Necessária</h1>
              <p className="text-gray-300 max-w-2xl mx-auto mb-6">
                Olá, {user?.email}! Para acessar o NCM Analyzer Pro e economizar milhares em suas importações, 
                você precisa de uma assinatura ativa.
              </p>
              
              {userProfile?.subscription_status === 'canceled' && (
                <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 mb-6 max-w-2xl mx-auto flex items-center gap-3">
                  <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                  <div className="text-left">
                    <p className="text-red-300 font-semibold">Assinatura Cancelada</p>
                    <p className="text-red-400 text-sm">
                      Sua assinatura foi cancelada. Assine novamente para continuar usando o serviço.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <PricingPlans />
          </div>
        </div>
      )

    case 'active':
      // Usuário ativo - liberar acesso
      return <>{children}</>

    default:
      // Fallback para casos não previstos
      return (
        <div className="bg-gradient-to-br from-slate-900 to-gray-900 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <div className="bg-orange-500 p-4 rounded-lg inline-block mb-4">
                <Lock className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">🚗 Acesso Restrito</h1>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Para usar o NCM Analyzer Pro, você precisa estar logado e ter uma assinatura ativa.
              </p>
            </div>
            <AuthForm mode="login" onToggleMode={() => {}} />
          </div>
        </div>
      )
  }

}

export default SubscriptionGuard