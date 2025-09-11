import { useState } from 'react';
import { Check, Star, TrendingUp, Shield, Clock, Users, ArrowRight, Calculator, Award, Mail, LogIn } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import AuthForm from './components/Auth/AuthForm';

const LandingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('anual');
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user } = useAuth();
  // Form data state removed as it's not currently used

  // Funções removidas pois não estão sendo utilizadas

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">NCM Analyzer Pro</span>
            </div>
            <div className="flex items-center gap-8">
              <nav className="hidden md:flex space-x-8">
                <a href="#beneficios" className="text-gray-600 hover:text-blue-600">Benefícios</a>
                <a href="#funcionalidades" className="text-gray-600 hover:text-blue-600">Funcionalidades</a>
                <a href="#precos" className="text-gray-600 hover:text-blue-600">Preços</a>
                <a href="#contato" className="text-gray-600 hover:text-blue-600">Contato</a>
              </nav>
              {!user ? (
                <button
                  onClick={() => setShowAuthForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Entrar
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-gray-700">Olá, {user.email?.split('@')[0]}</span>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'dashboard' } }))}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Economize até <span className="text-blue-600">40%</span> em
              <br />Impostos de Importação
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              O único software especializado em otimização tributária para autopeças.
              Baseado em jurisprudência do CARF e validado pela base oficial da RFB.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a href="#precos" className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                Ver Planos <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a href="#demo" className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
                Demonstração Gratuita
              </a>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">R$ 2.5M+</div>
                <div className="text-gray-600">Economia gerada para clientes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">10.000+</div>
                <div className="text-gray-600">NCMs na base oficial</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">98%</div>
                <div className="text-gray-600">Taxa de sucesso</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Por que escolher o NCM Analyzer Pro?</h2>
            <p className="text-xl text-gray-600">A solução mais completa para otimização tributária em autopeças</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Economia Comprovada</h3>
              <p className="text-gray-600">Reduza até 40% dos custos de importação com reclassificações juridicamente fundamentadas</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Segurança Jurídica</h3>
              <p className="text-gray-600">Baseado em precedentes do CARF e validado pela base oficial da Receita Federal</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Resultados Rápidos</h3>
              <p className="text-gray-600">Análise completa em minutos, não em semanas. Interface intuitiva e relatórios detalhados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Funcionalidades Exclusivas</h2>
            <p className="text-xl text-gray-600">Tudo que você precisa para otimizar sua operação de importação</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Validação Automática NCM</h3>
                    <p className="text-gray-600">Verifica automaticamente se seus NCMs estão válidos e ativos na base oficial da RFB</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Base Jurisprudencial</h3>
                    <p className="text-gray-600">Mais de 500 precedentes do CARF catalogados e atualizados constantemente</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Relatórios Detalhados</h3>
                    <p className="text-gray-600">Relatórios em PDF com fundamentação jurídica completa para cada oportunidade</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Cálculo de ROI</h3>
                    <p className="text-gray-600">Calcula automaticamente a economia potencial em reais para cada item analisado</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Exemplo de Economia</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Produto:</span>
                  <span className="font-semibold">Filtro de Ar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">NCM Atual:</span>
                  <span className="font-mono">8421.39.90 (18% II)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">NCM Sugerido:</span>
                  <span className="font-mono text-green-600">8421.31.00 (14% II)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Anual:</span>
                  <span className="font-semibold">R$ 500.000</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Economia Anual:</span>
                  <span className="font-bold text-green-600">R$ 20.000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Planos e Preços</h2>
            <p className="text-xl text-gray-600">Escolha o plano ideal para sua empresa</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plano Anual */}
            <div className={`relative p-8 rounded-2xl border-2 transition-all ${
              selectedPlan === 'anual' ? 'border-blue-500 shadow-xl' : 'border-gray-200'
            }`}>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plano Anual</h3>
                <div className="text-5xl font-bold text-blue-600 mb-2">R$ 247</div>
                <div className="text-gray-600 mb-6">por ano</div>
                
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Análise ilimitada de NCMs</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Base oficial RFB atualizada</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Relatórios em PDF</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Suporte por email</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Atualizações incluídas</span>
                  </li>
                </ul>
                
                <button 
                  onClick={() => setSelectedPlan('anual')}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    selectedPlan === 'anual' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Escolher Plano Anual
                </button>
              </div>
            </div>
            
            {/* Plano Vitalício */}
            <div className={`relative p-8 rounded-2xl border-2 transition-all ${
              selectedPlan === 'vitalicio' ? 'border-blue-500 shadow-xl' : 'border-gray-200'
            }`}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  🔥 MAIS POPULAR
                </span>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Programa Vitalício</h3>
                <div className="text-5xl font-bold text-blue-600 mb-2">R$ 1.997</div>
                <div className="text-gray-600 mb-2">pagamento único</div>
                <div className="text-sm text-green-600 font-semibold mb-6">Economia de R$ 1.473 vs anual</div>
                
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="font-semibold">Tudo do plano anual +</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Acesso vitalício</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Atualizações automáticas da base</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Consultoria jurídica inclusa</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Novas funcionalidades gratuitas</span>
                  </li>
                </ul>
                
                <button 
                  onClick={() => setSelectedPlan('vitalicio')}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    selectedPlan === 'vitalicio' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Escolher Programa Vitalício
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">💳 Aceitamos PIX, cartão de crédito e boleto bancário</p>
            <p className="text-sm text-gray-500">Garantia de 30 dias ou seu dinheiro de volta</p>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">O que nossos clientes dizem</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Economizamos R$ 180.000 no primeiro ano usando o NCM Analyzer Pro. 
                O ROI foi de mais de 700%!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">Carlos Silva</div>
                  <div className="text-sm text-gray-500">Diretor Comercial, AutoParts Brasil</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Interface muito intuitiva e relatórios extremamente detalhados. 
                Nossa equipe jurídica aprovou todas as sugestões."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold">Ana Costa</div>
                  <div className="text-sm text-gray-500">Gerente Tributária, MegaAuto Ltda</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Ferramenta indispensável para qualquer importador de autopeças. 
                Pagou-se em menos de 2 meses."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold">Roberto Lima</div>
                  <div className="text-sm text-gray-500">CEO, ImportAuto Solutions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Contato */}
      <section id="contato" className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-8">Entre em Contato</h2>
            
            <div className="bg-white rounded-2xl p-12 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Fale Conosco</h3>
              <p className="text-gray-600 mb-8">
                Tem dúvidas sobre o NCM Analyzer Pro? Entre em contato conosco!
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <a 
                    href="mailto:ncmanalizerpro@gmail.com" 
                    className="text-xl font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    ncmanalizerpro@gmail.com
                  </a>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-6">
                Respondemos em até 24 horas úteis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Calculator className="h-8 w-8 text-blue-400 mr-2" />
                <span className="text-xl font-bold">NCM Analyzer Pro</span>
              </div>
              <p className="text-gray-400">
                A solução mais avançada para otimização tributária em importação de autopeças.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#funcionalidades" className="hover:text-white">Funcionalidades</a></li>
                <li><a href="#precos" className="hover:text-white">Preços</a></li>
                <li><a href="#demo" className="hover:text-white">Demonstração</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#contato" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">Documentação</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white">LGPD</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NCM Analyzer Pro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal de Autenticação */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-slate-900/90 to-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 border-2 border-orange-500/30 rounded-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl shadow-orange-500/10">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl">
                    <LogIn className="text-white" size={24} />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    {authMode === 'login' ? 'Entrar' : 'Criar Conta'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowAuthForm(false)}
                  className="text-gray-400 hover:text-orange-400 text-3xl font-bold transition-colors duration-200 hover:bg-slate-800/50 rounded-lg p-2"
                >
                  ×
                </button>
              </div>
              <AuthForm
                mode={authMode}
                onToggleMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                onSuccess={() => {
                  setShowAuthForm(false);
                  // Redirecionar para dashboard ou página apropriada
                  window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'dashboard' } }));
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;