import React from 'react'
import { Shield, Clock, RefreshCw, AlertCircle, CheckCircle, FileText } from 'lucide-react'

const WarrantyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold mb-2">Política de Garantia e Direitos do Consumidor</h1>
              <p className="text-sm sm:text-base text-blue-100">Seus direitos garantidos pelo Código de Defesa do Consumidor (CDC)</p>
            </div>
          </div>
        </div>

        {/* Direito de Arrependimento */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-green-500/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-green-500 p-2 sm:p-3 rounded-lg">
              <RefreshCw className="text-white" size={18} />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">🔄 Direito de Arrependimento - 7 Dias</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Para Compras Online e Telefônicas</h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-400 mt-1 flex-shrink-0" />
                  <span>Prazo de <strong className="text-white">7 dias corridos</strong> a partir do recebimento do produto ou assinatura do contrato</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-400 mt-1 flex-shrink-0" />
                  <span>Aplicável a todas as compras realizadas <strong className="text-white">fora do estabelecimento comercial</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-400 mt-1 flex-shrink-0" />
                  <span><strong className="text-white">Não é necessário justificar</strong> o motivo da desistência</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-400 mt-1 flex-shrink-0" />
                  <span>Devolução <strong className="text-white">integral do valor pago</strong>, incluindo frete e taxas</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 sm:p-4">
              <h4 className="text-green-300 font-medium mb-2">📋 Base Legal</h4>
              <p className="text-sm text-gray-300 mb-3">
                <strong>Artigo 49 do CDC:</strong> "O consumidor pode desistir do contrato, no prazo de 7 dias a contar de sua assinatura ou do ato de recebimento do produto ou serviço, sempre que a contratação de fornecimento de produtos e serviços ocorrer fora do estabelecimento comercial."
              </p>
              <div className="bg-green-800/50 rounded p-2">
                <p className="text-xs text-green-200">
                  ⚖️ <strong>Parágrafo único:</strong> Os valores pagos serão devolvidos de imediato, monetariamente atualizados.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Garantia Legal */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-orange-500/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-orange-500 p-2 sm:p-3 rounded-lg">
              <Clock className="text-white" size={18} />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">⏰ Garantia Legal - 30/90 Dias</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-500 p-2 rounded">
                  <span className="text-white font-bold text-sm">30</span>
                </div>
                <h3 className="text-blue-300 font-medium">Produtos Não Duráveis</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Alimentos e bebidas</li>
                <li>• Produtos de higiene e limpeza</li>
                <li>• Medicamentos</li>
                <li>• Produtos perecíveis em geral</li>
              </ul>
            </div>
            
            <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-purple-500 p-2 rounded">
                  <span className="text-white font-bold text-sm">90</span>
                </div>
                <h3 className="text-purple-300 font-medium">Produtos Duráveis</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Eletrodomésticos</li>
                <li>• Eletrônicos</li>
                <li>• Móveis</li>
                <li>• Veículos</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3 sm:p-4">
            <h4 className="text-orange-300 font-medium mb-2">⚠️ Importante Saber</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Os prazos de 30 e 90 dias são para <strong className="text-white">reclamação de vícios aparentes</strong>, não para garantia</p>
              <p>• A <strong className="text-white">garantia legal não tem prazo definido</strong> no CDC - ela existe enquanto o produto deveria funcionar</p>
              <p>• O consumidor sempre terá direito à garantia, mesmo após os prazos de reclamação</p>
            </div>
          </div>
        </div>

        {/* Garantia Contratual */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-purple-500/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-purple-500 p-2 sm:p-3 rounded-lg">
              <FileText className="text-white" size={18} />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">📄 Garantia Contratual</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Características</h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-purple-400 mt-1 flex-shrink-0" />
                  <span><strong className="text-white">Complementar à garantia legal</strong> - não a substitui</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-purple-400 mt-1 flex-shrink-0" />
                  <span>Oferecida <strong className="text-white">voluntariamente pelo fornecedor</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-purple-400 mt-1 flex-shrink-0" />
                  <span>Deve ser <strong className="text-white">conferida mediante termo escrito</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-purple-400 mt-1 flex-shrink-0" />
                  <span>Prazo e condições <strong className="text-white">definidos pelo fabricante</strong></span>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 sm:p-4">
              <h4 className="text-purple-300 font-medium mb-2">💡 Dica Importante</h4>
              <p className="text-sm text-gray-300 mb-3">
                Muitas vezes os fornecedores apresentam a garantia contratual como se fosse uma "extensão" da garantia legal, mas na verdade são direitos distintos e cumulativos.
              </p>
              <div className="bg-purple-800/50 rounded p-2">
                <p className="text-xs text-purple-200">
                  <strong>Artigo 50 do CDC:</strong> "A garantia contratual é complementar à legal e será conferida mediante termo escrito."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Como Exercer seus Direitos */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-800 border border-blue-500/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-blue-500 p-2 sm:p-3 rounded-lg">
              <AlertCircle className="text-white" size={18} />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">🛡️ Como Exercer seus Direitos</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 sm:p-4">
              <h3 className="text-blue-300 font-medium mb-3">1️⃣ Direito de Arrependimento</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Entre em contato em até 7 dias</li>
                <li>• Informe que deseja cancelar</li>
                <li>• Não precisa justificar</li>
                <li>• Solicite devolução integral</li>
              </ul>
            </div>
            
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 sm:p-4">
              <h3 className="text-green-300 font-medium mb-3">2️⃣ Problemas com Produto</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Documente o defeito</li>
                <li>• Entre em contato imediatamente</li>
                <li>• Exija reparo, troca ou devolução</li>
                <li>• Guarde comprovantes</li>
              </ul>
            </div>
            
            <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3 sm:p-4">
              <h3 className="text-orange-300 font-medium mb-3">3️⃣ Busque Ajuda</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• PROCON local</li>
                <li>• Consumidor.gov.br</li>
                <li>• Defensoria Pública</li>
                <li>• Juizados Especiais</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contato para Suporte */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">💬 Precisa de Ajuda?</h2>
            <p className="text-sm sm:text-base text-green-100 mb-4">
              Nossa equipe está pronta para esclarecer suas dúvidas sobre garantias e direitos do consumidor
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                <Shield size={18} />
                <span className="text-sm sm:text-base">Falar com Suporte</span>
              </button>
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                <FileText size={18} />
                <span className="text-sm sm:text-base">Ver Termos Completos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WarrantyPolicy