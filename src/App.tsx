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
import PricingPage from './pages/PricingPage';
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
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na autenticação');
      }

      if (isLogin) {
        // Login bem-sucedido - recarregar página para atualizar contexto
        window.location.href = '/dashboard';
      } else {
        // Registro bem-sucedido
        setMessage('Conta criada com sucesso! Verifique seu email para confirmar.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
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
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Rotas de autenticação */}
            <Route 
              path="/auth" 
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
                <ProtectedRoute requireAuth={true}>
                  <EmailVerificationPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Rota de pricing */}
            <Route 
              path="/pricing" 
              element={
                <ProtectedRoute requireAuth={true} requireEmailVerified={true}>
                  <PricingPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Dashboard - requer assinatura ativa */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireAuth={true} requireEmailVerified={true} requireActiveSubscription={true}>
                  <Dashboard />
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
