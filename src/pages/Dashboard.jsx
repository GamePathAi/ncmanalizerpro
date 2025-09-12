import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  BarChart3, 
  Search, 
  FileText, 
  Settings, 
  User, 
  Bell, 
  Download,
  TrendingUp,
  Package,
  Globe,
  Calendar,
  CreditCard,
  LogOut
} from 'lucide-react';

const Dashboard = () => {
  const { 
    user, 
    profile, 
    logout, 
    getAccessToken,
    loading: authLoading,
    getUserStatus,
    hasActiveSubscription,
    canAccessDashboard 
  } = useAuth();
  const navigate = useNavigate();
  const userStatus = getUserStatus();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    monthlyAnalyses: 0,
    savedReports: 0,
    activeAlerts: 0
  });

  useEffect(() => {
    if (hasActiveSubscription()) {
      loadSubscriptionData();
      loadDashboardStats();
    }
  }, [hasActiveSubscription]);

  const loadSubscriptionData = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/stripe/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    // Simular carregamento de estatísticas
    // Em uma aplicação real, isso viria de uma API
    setTimeout(() => {
      setStats({
        totalAnalyses: 1247,
        monthlyAnalyses: 89,
        savedReports: 23,
        activeAlerts: 5
      });
    }, 1000);
  };

  const handleManageSubscription = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          returnUrl: window.location.origin + '/dashboard'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erro ao abrir portal de assinatura:', error);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200'
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const QuickAction = ({ icon: Icon, title, description, onClick, color = 'blue' }) => {
    const colorClasses = {
      blue: 'hover:bg-blue-50 border-blue-200 text-blue-600',
      green: 'hover:bg-green-50 border-green-200 text-green-600',
      purple: 'hover:bg-purple-50 border-purple-200 text-purple-600'
    };

    return (
      <button
        onClick={onClick}
        className={`w-full p-4 border-2 border-dashed rounded-xl transition-colors ${colorClasses[color]}`}
      >
        <Icon className="w-8 h-8 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </button>
    );
  };

  // Verificar se pode acessar o dashboard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirecionar se não está autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirecionar baseado no status do usuário
  if (!canAccessDashboard()) {
    if (userStatus === 'pending_email') {
      return <Navigate to="/verify-email" replace />;
    }
    if (userStatus === 'pending_subscription') {
      return <Navigate to="/pricing" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">NCM PRO</h1>
              <nav className="hidden md:flex ml-10 space-x-8">
                <a href="#" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Dashboard
                </a>
                <a href="#" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Análises
                </a>
                <a href="#" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Relatórios
                </a>
                <a href="#" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Configurações
                </a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <button className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden md:block text-gray-700 font-medium">
                    {user?.email?.split('@')[0]}
                  </span>
                </button>
              </div>
              
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo de volta! 👋
          </h1>
          <p className="text-gray-600">
            Aqui está um resumo da sua atividade no NCM PRO
          </p>
        </div>

        {/* Subscription Status */}
        {subscription && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Plano {subscription.plan?.name || 'Ativo'}
                </h2>
                <p className="text-blue-100">
                  {subscription.plan && (
                    <>R$ {subscription.plan.price.toFixed(2).replace('.', ',')} por {subscription.plan.interval === 'month' ? 'mês' : 'ano'}</>
                  )}
                </p>
                {subscription.current_period_end && (
                  <p className="text-blue-100 text-sm mt-1">
                    Próxima cobrança: {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <button
                onClick={handleManageSubscription}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Gerenciar</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={BarChart3}
            title="Total de Análises"
            value={stats.totalAnalyses.toLocaleString()}
            subtitle="Desde o início"
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            title="Este Mês"
            value={stats.monthlyAnalyses}
            subtitle="Análises realizadas"
            color="green"
          />
          <StatCard
            icon={FileText}
            title="Relatórios Salvos"
            value={stats.savedReports}
            subtitle="Disponíveis para download"
            color="purple"
          />
          <StatCard
            icon={Bell}
            title="Alertas Ativos"
            value={stats.activeAlerts}
            subtitle="Monitoramento ativo"
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickAction
              icon={Search}
              title="Nova Análise"
              description="Analisar um novo código NCM"
              onClick={() => navigate('/analyze')}
              color="blue"
            />
            <QuickAction
              icon={FileText}
              title="Gerar Relatório"
              description="Criar relatório personalizado"
              onClick={() => navigate('/reports')}
              color="green"
            />
            <QuickAction
              icon={Package}
              title="Importar Dados"
              description="Importar lista de NCMs"
              onClick={() => navigate('/import')}
              color="purple"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Analyses */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Análises Recentes</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todas
              </button>
            </div>
            
            <div className="space-y-4">
              {[
                { ncm: '8471.30.12', description: 'Computadores portáteis', date: '2024-01-15', status: 'Concluída' },
                { ncm: '8517.12.31', description: 'Telefones celulares', date: '2024-01-14', status: 'Concluída' },
                { ncm: '9403.10.00', description: 'Móveis de escritório', date: '2024-01-13', status: 'Em análise' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.ncm}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{new Date(item.date).toLocaleDateString('pt-BR')}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      item.status === 'Concluída' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Estatísticas Rápidas</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Países analisados</span>
                </div>
                <span className="font-semibold text-gray-900">23</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Categorias únicas</span>
                </div>
                <span className="font-semibold text-gray-900">156</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">Dias ativos</span>
                </div>
                <span className="font-semibold text-gray-900">45</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-orange-600" />
                  <span className="text-gray-700">Downloads realizados</span>
                </div>
                <span className="font-semibold text-gray-900">89</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                Ver relatório completo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;