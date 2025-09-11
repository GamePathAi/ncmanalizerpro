import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Shield, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PRICING_PLANS, formatPrice, redirectToCheckout } from '../../lib/stripe';

interface CheckoutPageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  cpfCnpj: string;
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recuperar plano selecionado do localStorage
  useEffect(() => {
    const storedPlan = localStorage.getItem('selectedPlan') as 'monthly' | 'annual';
    if (storedPlan) {
      setSelectedPlan(storedPlan);
    }
  }, []);

  // Definir produto baseado no plano selecionado
  const product = {
    priceId: selectedPlan === 'annual' ? PRICING_PLANS[0].stripePriceIdYearly : PRICING_PLANS[0].stripePriceIdMonthly,
    amount: selectedPlan === 'annual' ? PRICING_PLANS[0].yearlyPrice * 100 : PRICING_PLANS[0].monthlyPrice * 100,
    name: `${PRICING_PLANS[0].name} - ${selectedPlan === 'annual' ? 'Anual' : 'Mensal'}`,
    description: selectedPlan === 'annual' ? 'Cobrança anual com desconto' : 'Cobrança mensal'
  };
  const [formData, setFormData] = useState<FormData>({
    name: (user as any)?.displayName || '',
    email: user?.email || '',
    company: '',
    phone: '',
    cpfCnpj: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.cpfCnpj) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Por favor, insira um email válido.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) {
      setError('Você precisa estar logado para continuar.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Salvar dados do cliente antes de redirecionar
      localStorage.setItem('checkout_customer_data', JSON.stringify(formData));
      
      // Redirecionar para o Stripe Checkout
      await redirectToCheckout(product.priceId, user.id, user.email!);
      
      // Se chegou até aqui, o checkout foi iniciado com sucesso
      setError('');
      onSuccess();
    } catch (err: any) {
      console.error('Erro no checkout:', err);
      setError('Erro ao processar pagamento. Tente novamente.');
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  return (
    <div className="checkout-page py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <div className="checkout-form-card rounded-xl p-8">
              <h1 className="checkout-title text-3xl font-bold mb-2">Finalizar Compra</h1>
              <p className="checkout-subtitle mb-8">Preencha seus dados para continuar</p>

              {error && (
                <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
                  <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                  <span className="text-red-300">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Pessoais */}
                <div>
                  <h3 className="checkout-title text-xl font-semibold mb-4">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="checkout-label block text-sm font-medium mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div>
                      <label className="checkout-label block text-sm font-medium mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                        placeholder="seu@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="checkout-label block text-sm font-medium mb-2">
                        CPF/CNPJ *
                      </label>
                      <input
                        type="text"
                        name="cpfCnpj"
                        required
                        value={formatCpfCnpj(formData.cpfCnpj)}
                        onChange={(e) => setFormData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                        className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                        placeholder="000.000.000-00"
                        maxLength={18}
                      />
                    </div>
                    
                    <div>
                      <label className="checkout-label block text-sm font-medium mb-2">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formatPhone(formData.phone)}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>

                {/* Dados da Empresa */}
                <div>
                  <h3 className="checkout-title text-xl font-semibold mb-4">Dados da Empresa (Opcional)</h3>
                  <div>
                    <label className="checkout-label block text-sm font-medium mb-2">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                      placeholder="Nome da sua empresa"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <h3 className="checkout-title text-xl font-semibold mb-4">Endereço (Opcional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="checkout-label block text-sm font-medium mb-2">
                        CEP
                      </label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={formatZipCode(formData.address.zipCode)}
                        onChange={handleInputChange}
                        className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>
                    
                    <div>
                      <label className="checkout-label block text-sm font-medium mb-2">
                        Rua
                      </label>
                      <input
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                        placeholder="Nome da rua"
                      />
                    </div>
                    
                    <div>
                      <label className="checkout-label block text-sm font-medium mb-2">
                        Número
                      </label>
                      <input
                        type="text"
                        name="address.number"
                        value={formData.address.number}
                        onChange={handleInputChange}
                        className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                        placeholder="123"
                      />
                    </div>
                    
                    <div>
                      <label className="checkout-label block text-sm font-medium mb-2">
                        Bairro
                      </label>
                      <input
                        type="text"
                        name="address.neighborhood"
                        value={formData.address.neighborhood}
                        onChange={handleInputChange}
                        className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                        placeholder="Nome do bairro"
                      />
                    </div>
                    
                    <div>
                      <label className="checkout-label block text-sm font-medium mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                        placeholder="Nome da cidade"
                      />
                    </div>
                    
                    <div>
                      <label className="checkout-label block text-sm font-medium mb-2">
                        Estado
                      </label>
                      <select
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                      >
                        <option value="">Selecione o estado</option>
                        <option value="AC">Acre</option>
                        <option value="AL">Alagoas</option>
                        <option value="AP">Amapá</option>
                        <option value="AM">Amazonas</option>
                        <option value="BA">Bahia</option>
                        <option value="CE">Ceará</option>
                        <option value="DF">Distrito Federal</option>
                        <option value="ES">Espírito Santo</option>
                        <option value="GO">Goiás</option>
                        <option value="MA">Maranhão</option>
                        <option value="MT">Mato Grosso</option>
                        <option value="MS">Mato Grosso do Sul</option>
                        <option value="MG">Minas Gerais</option>
                        <option value="PA">Pará</option>
                        <option value="PB">Paraíba</option>
                        <option value="PR">Paraná</option>
                        <option value="PE">Pernambuco</option>
                        <option value="PI">Piauí</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="RN">Rio Grande do Norte</option>
                        <option value="RS">Rio Grande do Sul</option>
                        <option value="RO">Rondônia</option>
                        <option value="RR">Roraima</option>
                        <option value="SC">Santa Catarina</option>
                        <option value="SP">São Paulo</option>
                        <option value="SE">Sergipe</option>
                        <option value="TO">Tocantins</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="checkout-label block text-sm font-medium mb-2">
                        Complemento
                      </label>
                      <input
                        type="text"
                        name="address.complement"
                        value={formData.address.complement}
                        onChange={handleInputChange}
                        className="checkout-input w-full px-4 py-3 rounded-lg focus:ring-2"
                        placeholder="Apartamento, sala, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Botão de Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Continuar para Pagamento
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="checkout-form-card rounded-xl p-6 sticky top-8">
              <h3 className="checkout-title text-xl font-semibold mb-6">Resumo do Pedido</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-white">{product.name}</h4>
                    <p className="text-sm text-gray-400">{product.description}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-600 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Subtotal:</span>
                    <span className="text-white font-semibold">{formatPrice(product.amount)}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-600 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">Total:</span>
                    <span className="text-2xl font-bold text-blue-400">{formatPrice(product.amount)}</span>
                  </div>
                </div>
              </div>
              
              {/* Garantias */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="text-green-400 flex-shrink-0" size={16} />
                  <span className="text-sm text-gray-300">Garantia de 30 dias</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="text-green-400 flex-shrink-0" size={16} />
                  <span className="text-sm text-gray-300">Pagamento 100% seguro</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="text-green-400 flex-shrink-0" size={16} />
                  <span className="text-sm text-gray-300">Suporte técnico incluído</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;