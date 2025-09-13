import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Contextos
import { AuthProvider } from './contexts/AuthContext';

// Componentes de autenticação
import ProtectedRoute, { PublicRoute, StateBasedRedirect } from './components/ProtectedRoute';

// Páginas
import LandingPage from './LandingPage';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import EmailVerificationPage from './pages/EmailVerificationPage';

// Componentes de autenticação existentes
import EmailConfirmation from './components/Auth/EmailConfirmation';
import AuthCallback from './components/Auth/AuthCallback';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Componentes de checkout
import CheckoutPage from './components/Checkout/CheckoutPage';
import SuccessPage from './components/Checkout/SuccessPage';
import CancelPage from './components/Checkout/CancelPage';

// NCMpro component
import NCMpro from './NCMpro';

// Componente de login/registro simples
const AuthPage = () => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Sistema de autenticação local temporário para contornar problemas do Supabase
      if (isLogin) {
        // Verificar credenciais de teste
        if (email === 'test@ncmpro.com' && password === '123456') {
          // Simular login bem-sucedido
          localStorage.setItem('auth_token', 'temp_token_' + Date.now());
          localStorage.setItem('user_email', email);
          localStorage.setItem('user_status', 'active');
          
          setMessage('Login realizado com sucesso!');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else {
          throw new Error('Credenciais inválidas. Use: test@ncmpro.com / 123456');
        }
      } else {
        // Registro - simular sucesso
        setMessage('Conta criada com sucesso! Use test@ncmpro.com / 123456 para fazer login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error('Erro na autenticação:', err);
      
      // Melhor tratamento de erros baseado no status da resposta
      if (err.message) {
        setError(err.message);
      } else if (!navigator.onLine) {
        setError('Sem conexão com a internet. Verifique sua conexão.');
      } else {
        setError('Falha na conexão com o servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">NCM PRO</h1>
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Entrar na sua conta' : 'Criar nova conta'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 font-medium text-blue-600 hover:text-blue-500"
            >
              {isLogin ? 'Registre-se' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Sua senha"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  isLogin ? 'Entrar' : 'Criar conta'
                )}
              </button>
            </div>
          </form>

          {isLogin && (
            <div className="mt-6 text-center">
              <a
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Esqueceu sua senha?
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  // Mock data para NCM oficial (simulando base da RFB)
  const ncmOficial = new Set([
    '8421.39.90', '8708.29.99', '8708.30.99', '8708.80.10',
    '7318.15.00', '4016.93.00', '8536.90.90', '2710.19.90'
  ]);
  
  // Função para validar NCM
  const validateNCM = (ncm: string) => {
    const isValid = ncmOficial.has(ncm);
    return {
      isValid,
      isActive: isValid, // Para simplificar, consideramos que todos os válidos estão ativos
      description: isValid ? 'NCM válido na base RFB' : 'NCM não encontrado'
    };
  };
  
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="App">
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Rotas de autenticação */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              } 
            />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/confirm" element={<EmailConfirmation />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Rota de verificação de email */}
            <Route 
              path="/verify-email" 
              element={
                <ProtectedRoute 
                  requireAuth={true} 
                  allowedStatuses={['pending_email']}
                >
                  <EmailVerificationPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Rota de pricing - apenas para usuários com email verificado */}
            <Route 
              path="/pricing" 
              element={
                <ProtectedRoute 
                  requireAuth={true} 
                  allowedStatuses={['pending_subscription']}
                >
                  <Pricing />
                </ProtectedRoute>
              } 
            />
            
            {/* Dashboard - requer assinatura ativa */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute 
                  requireAuth={true} 
                  allowedStatuses={['active']}
                >
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* NCM Analyzer - requer assinatura ativa */}
            <Route 
              path="/analyze" 
              element={
                <ProtectedRoute 
                  requireAuth={true} 
                  allowedStatuses={['active']}
                >
                  <NCMpro 
                    isLoadingNCM={false}
                    ncmOficial={ncmOficial}
                    validateNCM={validateNCM}
                  />
                </ProtectedRoute>
              } 
            />
            
            {/* Rotas de checkout */}
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute requireAuth={true} requireEmailVerified={true}>
                  <CheckoutPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/checkout/success" element={<SuccessPage />} />
            <Route path="/checkout/cancel" element={<CancelPage />} />
            
            {/* Redirecionamento baseado no estado */}
            <Route path="/app" element={<StateBasedRedirect />} />
            
            {/* Rota catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
