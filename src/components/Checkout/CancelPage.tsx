import React from 'react';
import { XCircle, ArrowLeft, RefreshCw, MessageCircle, CreditCard } from 'lucide-react';

interface CancelPageProps {
  onRetry: () => void;
  onBackToPricing: () => void;
  onContactSupport: () => void;
}

const CancelPage: React.FC<CancelPageProps> = ({ 
  onRetry, 
  onBackToPricing, 
  onContactSupport 
}) => {
  const handleContactSupport = () => {
    window.open('mailto:ncmanalizerpro@gmail.com?subject=Problema com Pagamento - NCM Analyzer Pro', '_blank');
    onContactSupport();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-orange-500 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <XCircle className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pagamento Cancelado</h1>
          <p className="text-xl text-gray-700">
            Não se preocupe! Você pode tentar novamente a qualquer momento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações sobre o Cancelamento */}
          <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">O que aconteceu?</h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                Seu pagamento foi cancelado e nenhuma cobrança foi realizada. 
                Isso pode ter acontecido por alguns motivos:
              </p>
              
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Você decidiu cancelar o processo de pagamento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Houve um problema temporário com o processamento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Informações do cartão podem estar incorretas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Limite do cartão pode ter sido atingido</span>
                </li>
              </ul>
            </div>
            
            {/* Botões de Ação */}
            <div className="mt-8 space-y-3">
              <button
                onClick={onRetry}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Tentar Novamente
              </button>
              
              <button
                onClick={onBackToPricing}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Voltar aos Planos
              </button>
            </div>
          </div>

          {/* Suporte e Alternativas */}
          <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Precisa de Ajuda?</h2>
            
            <div className="space-y-6">
              {/* Suporte */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-blue-700 font-semibold mb-3 flex items-center gap-2">
                  <MessageCircle size={20} />
                  Fale Conosco
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Nossa equipe está pronta para te ajudar com qualquer problema de pagamento.
                </p>
                <button
                  onClick={handleContactSupport}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Entrar em Contato
                </button>
              </div>
              
              {/* Métodos de Pagamento */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-green-700 font-semibold mb-3 flex items-center gap-2">
                  <CreditCard size={20} />
                  Métodos Aceitos
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Aceitamos os seguintes métodos de pagamento:
                </p>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Cartão de Crédito (Visa, Mastercard, Elo)</li>
                  <li>• Cartão de Débito</li>
                  <li>• PIX (via Stripe)</li>
                  <li>• Boleto Bancário</li>
                </ul>
              </div>
              
              {/* Garantia */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-purple-700 font-semibold mb-3">🛡️ Pagamento Seguro</h3>
                <p className="text-gray-600 text-sm">
                  Todos os pagamentos são processados com segurança através do Stripe, 
                  uma das plataformas de pagamento mais confiáveis do mundo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefícios Perdidos */}
        <div className="mt-8 bg-white border border-gray-200 shadow-lg rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Você está perdendo essas vantagens:
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-500 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-gray-900 font-semibold mb-2">Economia de até 40%</h3>
              <p className="text-gray-600 text-sm">
                Reduza significativamente os impostos de importação
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-500 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-gray-900 font-semibold mb-2">Análise Instantânea</h3>
              <p className="text-gray-600 text-sm">
                Resultados em segundos com IA avançada
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-500 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-gray-900 font-semibold mb-2">Relatórios Detalhados</h3>
              <p className="text-gray-600 text-sm">
                Documentação completa para auditoria
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <button
              onClick={onRetry}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-lg"
            >
              Não Perder Essas Vantagens - Tentar Novamente
            </button>
          </div>
        </div>

        {/* FAQ Rápido */}
        <div className="mt-8 bg-white border border-gray-200 shadow-lg rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Perguntas Frequentes</h2>
          
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-gray-900 font-semibold mb-2">Meus dados estão seguros?</h3>
              <p className="text-gray-600 text-sm">
                Sim! Não armazenamos dados de cartão. Tudo é processado com segurança pelo Stripe.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-gray-900 font-semibold mb-2">Posso tentar com outro cartão?</h3>
              <p className="text-gray-600 text-sm">
                Claro! Você pode tentar com qualquer cartão de crédito ou débito válido.
              </p>
            </div>
            
            <div>
              <h3 className="text-gray-900 font-semibold mb-2">E se o problema persistir?</h3>
              <p className="text-gray-600 text-sm">
                Entre em contato conosco pelo email ncmanalizerpro@gmail.com e resolveremos rapidamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelPage;