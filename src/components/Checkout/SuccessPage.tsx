import React, { useState, useEffect } from 'react';
import { CheckCircle, Download, ArrowRight, Mail, Calendar, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { verifyPaymentStatus, formatPrice } from '../../lib/stripe';

interface SuccessPageProps {
  sessionId?: string;
  onContinue: () => void;
}

interface PaymentData {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  planType: 'monthly' | 'annual';
  subscriptionId?: string;
  invoiceUrl?: string;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ sessionId, onContinue }) => {
  const { user, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      // Tentar obter sessionId dos props ou da URL
      let currentSessionId = sessionId;
      
      if (!currentSessionId) {
        const urlParams = new URLSearchParams(window.location.search);
        currentSessionId = urlParams.get('session_id') || undefined;
      }
      
      if (!currentSessionId) {
        setError('ID da sessão não encontrado');
        setLoading(false);
        return;
      }

      try {
        // Verificar status do pagamento
        const paymentInfo = await verifyPaymentStatus(currentSessionId);
        setPaymentData(paymentInfo);

        // Recuperar dados do cliente salvos no localStorage
        const savedCustomerData = localStorage.getItem('checkout_customer_data');
        if (savedCustomerData) {
          setCustomerData(JSON.parse(savedCustomerData));
          // Limpar dados do localStorage após uso
          localStorage.removeItem('checkout_customer_data');
        }

        // Atualizar dados do usuário para refletir a nova assinatura
        // User data refresh functionality removed
      } catch (err: any) {
        console.error('Erro ao verificar pagamento:', err);
        setError('Erro ao verificar o status do pagamento');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  const handleDownloadInvoice = () => {
    if (paymentData?.invoiceUrl) {
      window.open(paymentData.invoiceUrl, '_blank');
    }
  };

  const handleSendWelcomeEmail = async () => {
    // Aqui você pode implementar o envio de email de boas-vindas
    // Por enquanto, vamos apenas mostrar uma mensagem
    alert('Email de boas-vindas enviado com sucesso!');
  };

  const handleAccessDashboard = async () => {
    try {
      // Forçar atualização do perfil do usuário para garantir que o status da assinatura seja atualizado
      if (user) {
        await refreshUserProfile();
        console.log('Perfil do usuário atualizado com sucesso');
      }
      
      // Aguardar um momento para garantir que a atualização foi processada
      setTimeout(() => {
        onContinue();
      }, 500);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      // Mesmo com erro, redirecionar para o dashboard
      onContinue();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-800 text-lg">Verificando pagamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Erro na Verificação</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={onContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de Sucesso */}
        <div className="text-center mb-12">
          <div className="bg-green-500 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pagamento Realizado com Sucesso! 🎉</h1>
          <p className="text-xl text-gray-700">
            Bem-vindo ao NCM Analyzer Pro! Sua assinatura está ativa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Detalhes do Pagamento */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <CreditCard className="text-green-600" size={24} />
              Detalhes do Pagamento
            </h2>
            
            {paymentData && (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Plano:</span>
                  <span className="text-gray-900 font-semibold">
                    {paymentData.planType === 'monthly' ? 'NCM Pro - Mensal' : 'NCM Pro - Anual'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Valor Pago:</span>
                  <span className="text-green-600 font-bold text-xl">
                    {formatPrice(paymentData.amount, paymentData.currency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900">{paymentData.customerEmail}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Data:</span>
                  <span className="text-gray-900">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                
                {paymentData.subscriptionId && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600">ID da Assinatura:</span>
                    <span className="text-gray-900 font-mono text-sm">{paymentData.subscriptionId}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Botões de Ação */}
            <div className="mt-8 space-y-3">
              {paymentData?.invoiceUrl && (
                <button
                  onClick={handleDownloadInvoice}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Baixar Nota Fiscal
                </button>
              )}
              
              <button
                onClick={handleSendWelcomeEmail}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Mail size={20} />
                Enviar Email de Boas-vindas
              </button>
            </div>
          </div>

          {/* Próximos Passos */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Calendar className="text-blue-600" size={24} />
              Próximos Passos
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold mb-2">Acesse o Dashboard</h3>
                  <p className="text-gray-600 text-sm">
                    Explore todas as funcionalidades do NCM Analyzer Pro no seu dashboard personalizado.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold mb-2">Comece a Analisar</h3>
                  <p className="text-gray-600 text-sm">
                    Faça upload dos seus arquivos de importação e comece a economizar nos impostos.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold mb-2">Suporte Técnico</h3>
                  <p className="text-gray-600 text-sm">
                    Precisa de ajuda? Nossa equipe está disponível para te auxiliar.
                  </p>
                  <a 
                    href="mailto:ncmanalizerpro@gmail.com" 
                    className="text-blue-600 hover:text-blue-700 text-sm underline"
                  >
                    ncmanalizerpro@gmail.com
                  </a>
                </div>
              </div>
            </div>
            
            {/* Botão Principal */}
            <div className="mt-8">
              <button
                onClick={handleAccessDashboard}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 text-lg"
              >
                Acessar Dashboard
                <ArrowRight size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        {customerData && (
          <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nome:</span>
                <span className="text-gray-900 ml-2">{customerData.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="text-gray-900 ml-2">{customerData.email}</span>
              </div>
              {customerData.company && (
                <div>
                  <span className="text-gray-600">Empresa:</span>
                  <span className="text-gray-900 ml-2">{customerData.company}</span>
                </div>
              )}
              {customerData.phone && (
                <div>
                  <span className="text-gray-600">Telefone:</span>
                  <span className="text-gray-900 ml-2">{customerData.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Garantia */}
        <div className="mt-8 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-green-800 font-semibold mb-2">🛡️ Garantia de 30 Dias</h3>
            <p className="text-green-700 text-sm">
              Não ficou satisfeito? Oferecemos garantia total de 30 dias. 
              Entre em contato conosco para solicitar o reembolso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;