import React, { useState } from 'react';
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import SubscriptionGuard from './components/Auth/SubscriptionGuard'
import UserDashboard from './components/Dashboard/UserDashboard'
import PricingPlans from './components/Pricing/PricingPlans'
import NCMAnalyzer from './NCMpro'
import LandingPage from './LandingPage'
import CheckoutPage from './components/Checkout/CheckoutPage'
import SuccessPage from './components/Checkout/SuccessPage'
import CancelPage from './components/Checkout/CancelPage'
import EmailConfirmation from './components/Auth/EmailConfirmation'
import AuthCallback from './components/Auth/AuthCallback'
import { useAuth } from './contexts/AuthContext'

// Componente interno que usa o contexto de autenticação
function AppContent() {
  const [currentPage, setCurrentPage] = useState('landing');
  const { user, isSubscribed } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'analyzer':
        return (
          <SubscriptionGuard requireSubscription={true}>
            <NCMAnalyzer />
          </SubscriptionGuard>
        );
      case 'dashboard':
        return (
          <SubscriptionGuard requireSubscription={false}>
            <UserDashboard />
          </SubscriptionGuard>
        );
      case 'pricing':
        return (
          <PricingPlans 
            onNavigateToCheckout={(planType) => {
              // Armazenar o plano selecionado para usar na página de checkout
              localStorage.setItem('selectedPlan', planType);
              setCurrentPage('checkout');
            }}
          />
        );
      case 'checkout':
        return (
          <CheckoutPage 
            onSuccess={() => setCurrentPage('success')}
            onCancel={() => setCurrentPage('cancel')}
          />
        );
      case 'success':
        return (
          <SuccessPage 
            onContinue={() => setCurrentPage('dashboard')}
          />
        );
      case 'cancel':
        return (
          <CancelPage 
            onRetry={() => setCurrentPage('checkout')}
            onBackToPricing={() => setCurrentPage('pricing')}
            onContactSupport={() => console.log('Contacting support...')}
          />
        );
      case 'email-confirmation':
        return <EmailConfirmation />;
      case 'auth/callback':
        return <AuthCallback />;
      case 'landing':
      default:
        return <LandingPage />;
    }
  };

  // Adicionar navegação global
  React.useEffect(() => {
    const handleNavigation = (event: CustomEvent) => {
      setCurrentPage(event.detail.page);
    };

    window.addEventListener('navigate' as any, handleNavigation);
    return () => window.removeEventListener('navigate' as any, handleNavigation);
  }, []);

  return (
    <div className="App">
      {renderPage()}
      
      {/* Navegação flutuante */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {/* Botão principal baseado no estado do usuário */}
        {!user ? (
          <button
            onClick={() => setCurrentPage('pricing')}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2"
          >
            👑 Assinar Agora
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            {isSubscribed && (
              <button
                onClick={() => setCurrentPage(currentPage === 'analyzer' ? 'dashboard' : 'analyzer')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2"
              >
                {currentPage === 'analyzer' ? '📊 Dashboard' : '🔧 Analisador'}
              </button>
            )}
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2"
            >
              👤 Conta
            </button>
          </div>
        )}
        
        {/* Botão para voltar ao site */}
        <button
          onClick={() => setCurrentPage('landing')}
          className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2"
        >
          🏠 Início
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
