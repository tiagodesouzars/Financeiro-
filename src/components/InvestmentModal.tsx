import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  X,
  Building2,
  DollarSign,
  Calendar,
  Layers,
  ShieldCheck,
  Coins,
  Landmark,
  Briefcase,
  Percent,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  InvestmentAsset,
  InvestmentCategory,
  InvestmentCategoryGroup,
  InvestmentOperationType,
  InvestmentCurrency,
  InvestmentStatus,
  PaymentMethod,
  RendaFixaTipoAtivo,
  RendaFixaRentabilidade,
  RendaFixaIndexador,
  RendaFixaLiquidez,
  TesouroTipoTitulo,
  RendaVariavelTipoAtivo,
  CriptoCustodia,
  FundoClasse,
} from '../types';
import {
  formatCurrency,
  getTodayDateString,
  ALL_INVESTMENT_CATEGORIES,
} from '../utils/formatters';
import { getCategoryGroup } from '../utils/storage';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInvestment: (
    asset: InvestmentAsset,
    debitFromBudget: boolean,
    paymentMethod: PaymentMethod
  ) => void;
  assetToEdit?: InvestmentAsset | null;
  selectedMonth: string;
}

const BROKER_PRESETS = [
  'XP Investimentos',
  'BTG Pactual',
  'NuInvest / Nubank',
  'Banco Inter',
  'Itaú Íon',
  'Bradesco Ágora',
  'Clear Corretora',
  'Rico',
  'Binance',
  'Mercado Bitcoin',
  'Bybit',
  'Nomad / Avenue',
];

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  onSaveInvestment,
  assetToEdit,
  selectedMonth,
}) => {
  // 1. Group Selector
  const [activeGroup, setActiveGroup] = useState<InvestmentCategoryGroup>('RENDA_VARIAVEL');

  // Base Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InvestmentCategory>('Ações');
  const [institution, setInstitution] = useState('');
  const [tipoOperacao, setTipoOperacao] = useState<InvestmentOperationType>('COMPRA');
  const [moeda, setMoeda] = useState<InvestmentCurrency>('BRL');
  const [status, setStatus] = useState<InvestmentStatus>('EXECUTADA');
  const [dataOperacao, setDataOperacao] = useState(getTodayDateString());
  const [dataLiquidacao, setDataLiquidacao] = useState('');
  const [notes, setNotes] = useState('');

  // Values & Calculations
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');

  // 2. Polymorphic: Renda Variável
  const [rvTicker, setRvTicker] = useState('');
  const [rvTipoAtivo, setRvTipoAtivo] = useState<RendaVariavelTipoAtivo>('ACAO');
  const [rvCorretagem, setRvCorretagem] = useState('0');
  const [rvEmolumentos, setRvEmolumentos] = useState('0');
  const [rvSetor, setRvSetor] = useState('');

  // 3. Polymorphic: Renda Fixa Privada
  const [rfTipoAtivo, setRfTipoAtivo] = useState<RendaFixaTipoAtivo>('CDB');
  const [rfEmissor, setRfEmissor] = useState('');
  const [rfRentabilidade, setRfRentabilidade] = useState<RendaFixaRentabilidade>('POS_FIXADA');
  const [rfIndexador, setRfIndexador] = useState<RendaFixaIndexador>('CDI');
  const [rfTaxaPactuada, setRfTaxaPactuada] = useState('110');
  const [rfVencimento, setRfVencimento] = useState('');
  const [rfCarencia, setRfCarencia] = useState('');
  const [rfLiquidez, setRfLiquidez] = useState<RendaFixaLiquidez>('DIARIA');
  const [rfIsentoIr, setRfIsentoIr] = useState(false);

  // 4. Polymorphic: Tesouro Direto
  const [tdTipoTitulo, setTdTipoTitulo] = useState<TesouroTipoTitulo>('TESOURO_SELIC');
  const [tdAnoVencimento, setTdAnoVencimento] = useState('2029');
  const [tdTaxaB3, setTdTaxaB3] = useState('0.20');
  const [tdCupom, setTdCupom] = useState(false);

  // 5. Polymorphic: Criptomoedas
  const [crSymbol, setCrSymbol] = useState('BTC');
  const [crRede, setCrRede] = useState('Bitcoin Network');
  const [crTaxaRede, setCrTaxaRede] = useState('0');
  const [crTaxaExchange, setCrTaxaExchange] = useState('0');
  const [crCustodia, setCrCustodia] = useState<CriptoCustodia>('EXCHANGE');
  const [crEndereco, setCrEndereco] = useState('');

  // 6. Polymorphic: Fundos
  const [fundoNome, setFundoNome] = useState('');
  const [fundoCnpj, setFundoCnpj] = useState('');
  const [fundoClasse, setFundoClasse] = useState<FundoClasse>('MULTIMERCADO');
  const [fundoDcotizacao, setFundoDcotizacao] = useState('30');
  const [fundoDliquidacao, setFundoDliquidacao] = useState('2');
  const [fundoComeCotas, setFundoComeCotas] = useState(true);

  // Debit from cash flow
  const [debitFromBudget, setDebitFromBudget] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');

  // Load existing asset or defaults
  useEffect(() => {
    if (assetToEdit) {
      const group = assetToEdit.categoria_ativo || getCategoryGroup(assetToEdit.category || 'Outros');
      setActiveGroup(group);
      setName(assetToEdit.name);
      setCategory(assetToEdit.category || 'Ações');
      setInstitution(assetToEdit.id_instituicao || assetToEdit.institution || '');
      setTipoOperacao(assetToEdit.tipo_operacao || 'COMPRA');
      setMoeda(assetToEdit.moeda || 'BRL');
      setStatus(assetToEdit.status || 'EXECUTADA');
      setDataOperacao(assetToEdit.data_operacao || assetToEdit.purchaseDate || getTodayDateString());
      setDataLiquidacao(assetToEdit.data_liquidacao || '');
      setQuantity(String(assetToEdit.quantity || 1));
      setUnitPrice(String(assetToEdit.purchasePrice || ''));
      setCurrentPrice(assetToEdit.currentPrice ? String(assetToEdit.currentPrice) : '');
      setNotes(assetToEdit.notes || '');
      setDebitFromBudget(false); // Don't duplicate debit on edit

      // Populate details if available
      if (assetToEdit.detalhes_renda_variavel) {
        const d = assetToEdit.detalhes_renda_variavel;
        setRvTicker(d.ticker || '');
        setRvTipoAtivo(d.tipo_ativo || 'ACAO');
        setRvCorretagem(String(d.taxa_corretagem || 0));
        setRvEmolumentos(String(d.emolumentos_b3 || 0));
        setRvSetor(d.setor_atuacao || '');
      }
      if (assetToEdit.detalhes_renda_fixa) {
        const d = assetToEdit.detalhes_renda_fixa;
        setRfTipoAtivo(d.tipo_ativo || 'CDB');
        setRfEmissor(d.emissor || '');
        setRfRentabilidade(d.tipo_rentabilidade || 'POS_FIXADA');
        setRfIndexador(d.indexador || 'CDI');
        setRfTaxaPactuada(String(d.taxa_pactuada || 100));
        setRfVencimento(d.data_vencimento || '');
        setRfCarencia(d.data_carencia || '');
        setRfLiquidez(d.liquidez || 'DIARIA');
        setRfIsentoIr(Boolean(d.isento_ir));
      }
      if (assetToEdit.detalhes_tesouro) {
        const d = assetToEdit.detalhes_tesouro;
        setTdTipoTitulo(d.tipo_titulo || 'TESOURO_SELIC');
        setTdAnoVencimento(String(d.ano_vencimento || 2029));
        setTdTaxaB3(String(d.taxa_b3 || 0.20));
        setTdCupom(Boolean(d.pagamento_cupom));
      }
      if (assetToEdit.detalhes_cripto) {
        const d = assetToEdit.detalhes_cripto;
        setCrSymbol(d.symbol || 'BTC');
        setCrRede(d.rede_blockchain || 'Bitcoin Network');
        setCrTaxaRede(String(d.taxa_rede || 0));
        setCrTaxaExchange(String(d.taxa_exchange || 0));
        setCrCustodia(d.custodia || 'EXCHANGE');
        setCrEndereco(d.endereco_carteira || '');
      }
      if (assetToEdit.detalhes_fundos) {
        const d = assetToEdit.detalhes_fundos;
        setFundoNome(d.nome_fundo || '');
        setFundoCnpj(d.cnpj_fundo || '');
        setFundoClasse(d.classe_fundo || 'MULTIMERCADO');
        setFundoDcotizacao(String(d.prazo_cotizacao_resgate || 30));
        setFundoDliquidacao(String(d.prazo_liquidacao_resgate || 2));
        setFundoComeCotas(Boolean(d.come_cotas));
      }
    } else {
      // Default reset
      setName('');
      setCategory('Ações');
      setInstitution('');
      setTipoOperacao('COMPRA');
      setMoeda('BRL');
      setStatus('EXECUTADA');
      setDataOperacao(getTodayDateString());
      setDataLiquidacao('');
      setQuantity('1');
      setUnitPrice('');
      setCurrentPrice('');
      setNotes('');
      setDebitFromBudget(true);

      setRvTicker('');
      setRvTipoAtivo('ACAO');
      setRvCorretagem('0');
      setRvEmolumentos('0');
      setRvSetor('');

      setRfTipoAtivo('CDB');
      setRfEmissor('');
      setRfRentabilidade('POS_FIXADA');
      setRfIndexador('CDI');
      setRfTaxaPactuada('110');
      setRfVencimento('');
      setRfCarencia('');
      setRfLiquidez('DIARIA');
      setRfIsentoIr(false);

      setTdTipoTitulo('TESOURO_SELIC');
      setTdAnoVencimento('2029');
      setTdTaxaB3('0.20');
      setTdCupom(false);

      setCrSymbol('BTC');
      setCrRede('Bitcoin Network');
      setCrTaxaRede('0');
      setCrTaxaExchange('0');
      setCrCustodia('EXCHANGE');
      setCrEndereco('');

      setFundoNome('');
      setFundoCnpj('');
      setFundoClasse('MULTIMERCADO');
      setFundoDcotizacao('30');
      setFundoDliquidacao('2');
      setFundoComeCotas(true);
    }
  }, [assetToEdit, isOpen]);

  // When group changes, update UI category helper
  const handleGroupChange = (grp: InvestmentCategoryGroup) => {
    setActiveGroup(grp);
    if (grp === 'RENDA_VARIAVEL') {
      setCategory('Ações');
    } else if (grp === 'RENDA_FIXA') {
      setCategory('CDB');
    } else if (grp === 'TESOURO_DIRETO') {
      setCategory('Tesouro Direto');
    } else if (grp === 'CRIPTO') {
      setCategory('Criptomoedas');
    } else if (grp === 'FUNDOS') {
      setCategory('Fundos de Investimento');
    } else {
      setCategory('Outros');
    }
  };

  if (!isOpen) return null;

  // Real-time calculations
  const parsedQty = parseFloat(quantity.replace(',', '.')) || 0;
  const parsedUnitPrice = parseFloat(unitPrice.replace(',', '.')) || 0;
  const valorBruto = parsedQty * parsedUnitPrice;

  // Extra fees according to asset class
  let totalFees = 0;
  if (activeGroup === 'RENDA_VARIAVEL') {
    totalFees += (parseFloat(rvCorretagem.replace(',', '.')) || 0) + (parseFloat(rvEmolumentos.replace(',', '.')) || 0);
  } else if (activeGroup === 'CRIPTO') {
    totalFees += (parseFloat(crTaxaRede.replace(',', '.')) || 0) + (parseFloat(crTaxaExchange.replace(',', '.')) || 0);
  }

  // Preço Médio (dynamic calculation: [Valor Total Investido + Custos] / Quantidade)
  const precoMedioCalculado = parsedQty > 0 ? (valorBruto + totalFees) / parsedQty : parsedUnitPrice;
  const valorLiquido = tipoOperacao === 'COMPRA' ? valorBruto + totalFees : Math.max(0, valorBruto - totalFees);

  const parsedCurrentPrice = parseFloat(currentPrice.replace(',', '.')) || 0;
  const currentTotalValue =
    parsedCurrentPrice > 0 ? parsedQty * parsedCurrentPrice : valorLiquido;

  const profitLoss = currentTotalValue - valorLiquido;
  const profitLossPercent = valorLiquido > 0 ? (profitLoss / valorLiquido) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valorBruto <= 0) return;

    // Derived display title
    let displayTitle = name.trim();
    if (!displayTitle) {
      if (activeGroup === 'RENDA_VARIAVEL' && rvTicker) {
        displayTitle = rvTicker.toUpperCase().trim();
      } else if (activeGroup === 'RENDA_FIXA') {
        displayTitle = `${rfTipoAtivo} ${rfEmissor ? rfEmissor + ' ' : ''}${rfTaxaPactuada}% ${rfIndexador}`;
      } else if (activeGroup === 'TESOURO_DIRETO') {
        const titleMap: Record<TesouroTipoTitulo, string> = {
          TESOURO_SELIC: 'Tesouro Selic',
          TESOURO_IPCA: 'Tesouro IPCA+',
          TESOURO_PREFIXADO: 'Tesouro Prefixado',
          RENDA_MAIS: 'Tesouro Renda+',
          EDUCA_MAIS: 'Tesouro Educa+',
        };
        displayTitle = `${titleMap[tdTipoTitulo] || tdTipoTitulo} ${tdAnoVencimento}`;
      } else if (activeGroup === 'CRIPTO' && crSymbol) {
        displayTitle = crSymbol.toUpperCase().trim();
      } else if (activeGroup === 'FUNDOS' && fundoNome) {
        displayTitle = fundoNome.trim();
      } else {
        displayTitle = category;
      }
    }

    const newAsset: InvestmentAsset = {
      // 1. Base Fields
      id: assetToEdit ? assetToEdit.id : `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: displayTitle,
      category,
      categoria_ativo: activeGroup,
      id_instituicao: institution.trim() || undefined,
      institution: institution.trim() || undefined,
      tipo_operacao: tipoOperacao,
      data_operacao: dataOperacao,
      data_liquidacao: dataLiquidacao.trim() || undefined,
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      moeda,
      status,

      // Portfolio tracking
      quantity: parsedQty,
      purchasePrice: precoMedioCalculado,
      totalInvested: valorLiquido,
      currentPrice: parsedCurrentPrice > 0 ? parsedCurrentPrice : undefined,
      currentTotalValue: parsedCurrentPrice > 0 ? currentTotalValue : valorLiquido,
      purchaseDate: dataOperacao,
      notes: notes.trim() || undefined,
      linkedTransactionId: assetToEdit?.linkedTransactionId,
      createdAt: assetToEdit ? assetToEdit.createdAt : Date.now(),
      updatedAt: Date.now(),

      // Extension payloads
      ...(activeGroup === 'RENDA_VARIAVEL' && {
        detalhes_renda_variavel: {
          ticker: (rvTicker || displayTitle).toUpperCase().trim(),
          tipo_ativo: rvTipoAtivo,
          quantidade: parsedQty,
          preco_execucao: parsedUnitPrice,
          taxa_corretagem: parseFloat(rvCorretagem.replace(',', '.')) || 0,
          emolumentos_b3: parseFloat(rvEmolumentos.replace(',', '.')) || 0,
          preco_medio: precoMedioCalculado,
          setor_atuacao: rvSetor.trim() || undefined,
        },
      }),

      ...(activeGroup === 'RENDA_FIXA' && {
        detalhes_renda_fixa: {
          tipo_ativo: rfTipoAtivo,
          emissor: rfEmissor.trim() || 'Emissor Bancário',
          tipo_rentabilidade: rfRentabilidade,
          indexador: rfIndexador,
          taxa_pactuada: parseFloat(rfTaxaPactuada.replace(',', '.')) || 100,
          data_vencimento: rfVencimento || undefined,
          data_carencia: rfCarencia || undefined,
          liquidez: rfLiquidez,
          isento_ir: rfIsentoIr,
        },
      }),

      ...(activeGroup === 'TESOURO_DIRETO' && {
        detalhes_tesouro: {
          tipo_titulo: tdTipoTitulo,
          ano_vencimento: parseInt(tdAnoVencimento, 10) || 2029,
          quantidade_titulos: parsedQty,
          preco_unitario: parsedUnitPrice,
          taxa_b3: parseFloat(tdTaxaB3.replace(',', '.')) || 0.2,
          pagamento_cupom: tdCupom,
        },
      }),

      ...(activeGroup === 'CRIPTO' && {
        detalhes_cripto: {
          symbol: (crSymbol || displayTitle).toUpperCase().trim(),
          rede_blockchain: crRede.trim() || 'Principal',
          quantidade: parsedQty,
          preco_unitario_fiat: parsedUnitPrice,
          taxa_rede: parseFloat(crTaxaRede.replace(',', '.')) || 0,
          taxa_exchange: parseFloat(crTaxaExchange.replace(',', '.')) || 0,
          endereco_carteira: crEndereco.trim() || undefined,
          custodia: crCustodia,
        },
      }),

      ...(activeGroup === 'FUNDOS' && {
        detalhes_fundos: {
          nome_fundo: (fundoNome || displayTitle).trim(),
          cnpj_fundo: fundoCnpj.trim() || undefined,
          classe_fundo: fundoClasse,
          quantidade_cotas: parsedQty,
          valor_cota: parsedUnitPrice,
          prazo_cotizacao_resgate: parseInt(fundoDcotizacao, 10) || 30,
          prazo_liquidacao_resgate: parseInt(fundoDliquidacao, 10) || 2,
          come_cotas: fundoComeCotas,
        },
      }),
    };

    onSaveInvestment(newAsset, debitFromBudget && !assetToEdit, paymentMethod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[94vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {assetToEdit ? 'Editar Ativo / Ordem' : 'Novo Investimento & Carteira'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Arquitetura modular completa por classe de ativo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Asset Class Tabs */}
        <div className="mt-3.5">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Classe do Ativo
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleGroupChange('RENDA_VARIAVEL')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition ${
                activeGroup === 'RENDA_VARIAVEL'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ações/FIIs</span>
            </button>

            <button
              type="button"
              onClick={() => handleGroupChange('RENDA_FIXA')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition ${
                activeGroup === 'RENDA_FIXA'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Renda Fixa</span>
            </button>

            <button
              type="button"
              onClick={() => handleGroupChange('TESOURO_DIRETO')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition ${
                activeGroup === 'TESOURO_DIRETO'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Tesouro</span>
            </button>

            <button
              type="button"
              onClick={() => handleGroupChange('CRIPTO')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition ${
                activeGroup === 'CRIPTO'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Cripto</span>
            </button>

            <button
              type="button"
              onClick={() => handleGroupChange('FUNDOS')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition ${
                activeGroup === 'FUNDOS'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Fundos</span>
            </button>

            <button
              type="button"
              onClick={() => handleGroupChange('OUTROS')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition ${
                activeGroup === 'OUTROS'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Outros</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-3">
          {/* Base Row: Tipo de Operação & Moeda */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Operação
              </label>
              <select
                value={tipoOperacao}
                onChange={(e) => setTipoOperacao(e.target.value as InvestmentOperationType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-medium focus:outline-none focus:border-teal-500"
              >
                <option value="COMPRA">🟢 COMPRA</option>
                <option value="VENDA">🔵 VENDA</option>
                <option value="RESGATE">🟡 RESGATE</option>
                <option value="RENDIMENTO">🟣 RENDIMENTO</option>
                <option value="PAGAMENTO_DIVIDENDO">💎 DIVIDENDO / JCP</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Moeda
              </label>
              <select
                value={moeda}
                onChange={(e) => setMoeda(e.target.value as InvestmentCurrency)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-medium focus:outline-none focus:border-teal-500"
              >
                <option value="BRL">BRL (R$ Real)</option>
                <option value="USD">USD ($ Dólar)</option>
                <option value="EUR">EUR (€ Euro)</option>
              </select>
            </div>
          </div>

          {/* Institution / Corretora */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Instituição / Corretora
              </label>
              <span className="text-[10px] text-slate-400">XP, BTG, Inter, NuInvest...</span>
            </div>
            <input
              type="text"
              list="broker-list"
              placeholder="Ex: XP Investimentos, BTG, Banco Inter"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500"
            />
            <datalist id="broker-list">
              {BROKER_PRESETS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          {/* Polymorphic Section: Specific Inputs based on Asset Class */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            {/* 1. RENDA VARIÁVEL */}
            {activeGroup === 'RENDA_VARIAVEL' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                      Ticker (Código) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="PETR4, MXRF11, IVVB11"
                      value={rvTicker}
                      onChange={(e) => {
                        setRvTicker(e.target.value.toUpperCase());
                        if (!name) setName(e.target.value.toUpperCase());
                      }}
                      className="w-full uppercase font-mono font-bold bg-slate-800 border border-purple-500/40 rounded-xl px-2.5 py-1.5 text-purple-300 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Tipo de Ativo
                    </label>
                    <select
                      value={rvTipoAtivo}
                      onChange={(e) => setRvTipoAtivo(e.target.value as RendaVariavelTipoAtivo)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-medium focus:outline-none focus:border-purple-400"
                    >
                      <option value="ACAO">Ação (B3 / Ext)</option>
                      <option value="FII">FII (Fundo Imobiliário)</option>
                      <option value="ETF">ETF (Índice)</option>
                      <option value="BDR">BDR (Internacional)</option>
                      <option value="OPCAO">Opção / Derivativo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Setor (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Bancos, Energia, Petróleo"
                      value={rvSetor}
                      onChange={(e) => setRvSetor(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Taxas (Corretagem + B3)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        step="any"
                        placeholder="Corretagem"
                        value={rvCorretagem}
                        onChange={(e) => setRvCorretagem(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="B3"
                        value={rvEmolumentos}
                        onChange={(e) => setRvEmolumentos(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 2. RENDA FIXA PRIVADA */}
            {activeGroup === 'RENDA_FIXA' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-300 mb-1">
                      Tipo de Título
                    </label>
                    <select
                      value={rfTipoAtivo}
                      onChange={(e) => {
                        const val = e.target.value as RendaFixaTipoAtivo;
                        setRfTipoAtivo(val);
                        if (['LCI', 'LCA', 'CRI', 'CRA'].includes(val)) {
                          setRfIsentoIr(true);
                        }
                      }}
                      className="w-full bg-slate-800 border border-blue-500/40 rounded-xl px-2.5 py-1.5 text-blue-300 text-xs font-semibold focus:outline-none"
                    >
                      <option value="CDB">CDB</option>
                      <option value="LCI">LCI (Isento IR)</option>
                      <option value="LCA">LCA (Isento IR)</option>
                      <option value="CRI">CRI (Isento IR)</option>
                      <option value="CRA">CRA (Isento IR)</option>
                      <option value="DEBENTURE">Debênture</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Emissor (Banco / Empresa)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Banco Master, Inter, Vale"
                      value={rfEmissor}
                      onChange={(e) => setRfEmissor(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Rentabilidade
                    </label>
                    <select
                      value={rfRentabilidade}
                      onChange={(e) => setRfRentabilidade(e.target.value as RendaFixaRentabilidade)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                    >
                      <option value="POS_FIXADA">Pós-fixada</option>
                      <option value="PREFIXADA">Prefixada</option>
                      <option value="HIBRIDA">Híbrida (IPCA+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Indexador
                    </label>
                    <select
                      value={rfIndexador}
                      onChange={(e) => setRfIndexador(e.target.value as RendaFixaIndexador)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                    >
                      <option value="CDI">CDI</option>
                      <option value="IPCA">IPCA</option>
                      <option value="SELIC">SELIC</option>
                      <option value="NENHUM">Nenhum (Pré)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Taxa Pactuada
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 115 ou 12.5"
                      value={rfTaxaPactuada}
                      onChange={(e) => setRfTaxaPactuada(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Vencimento
                    </label>
                    <input
                      type="date"
                      value={rfVencimento}
                      onChange={(e) => setRfVencimento(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Liquidez
                    </label>
                    <select
                      value={rfLiquidez}
                      onChange={(e) => setRfLiquidez(e.target.value as RendaFixaLiquidez)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                    >
                      <option value="DIARIA">Diária</option>
                      <option value="NO_VENCIMENTO">No Vencimento</option>
                      <option value="APOS_CARENCIA">Após Carência</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={rfIsentoIr}
                        onChange={(e) => setRfIsentoIr(e.target.checked)}
                        className="rounded accent-blue-500 w-3.5 h-3.5"
                      />
                      <span>Isento de IR</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* 3. TESOURO DIRETO */}
            {activeGroup === 'TESOURO_DIRETO' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-300 mb-1">
                      Título Público
                    </label>
                    <select
                      value={tdTipoTitulo}
                      onChange={(e) => setTdTipoTitulo(e.target.value as TesouroTipoTitulo)}
                      className="w-full bg-slate-800 border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-emerald-300 text-xs font-semibold focus:outline-none"
                    >
                      <option value="TESOURO_SELIC">Tesouro Selic</option>
                      <option value="TESOURO_IPCA">Tesouro IPCA+</option>
                      <option value="TESOURO_PREFIXADO">Tesouro Prefixado</option>
                      <option value="RENDA_MAIS">Tesouro Renda+ (Aposentadoria)</option>
                      <option value="EDUCA_MAIS">Tesouro Educa+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Ano Vencimento
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 2029"
                      value={tdAnoVencimento}
                      onChange={(e) => setTdAnoVencimento(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Taxa Custódia B3 (% a.a.)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={tdTaxaB3}
                      onChange={(e) => setTdTaxaB3(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                    />
                  </div>

                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={tdCupom}
                        onChange={(e) => setTdCupom(e.target.checked)}
                        className="rounded accent-emerald-500 w-3.5 h-3.5"
                      />
                      <span>Paga Juros Semestrais (Cupom)</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* 4. CRIPTOMOEDAS */}
            {activeGroup === 'CRIPTO' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-orange-300 mb-1">
                      Símbolo / Moeda
                    </label>
                    <input
                      type="text"
                      placeholder="BTC, ETH, SOL, USDT"
                      value={crSymbol}
                      onChange={(e) => setCrSymbol(e.target.value.toUpperCase())}
                      className="w-full uppercase font-mono font-bold bg-slate-800 border border-orange-500/40 rounded-xl px-2.5 py-1.5 text-orange-300 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Rede Blockchain
                    </label>
                    <input
                      type="text"
                      placeholder="Bitcoin, ERC-20, Solana..."
                      value={crRede}
                      onChange={(e) => setCrRede(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Tipo de Custódia
                    </label>
                    <select
                      value={crCustodia}
                      onChange={(e) => setCrCustodia(e.target.value as CriptoCustodia)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-medium focus:outline-none"
                    >
                      <option value="EXCHANGE">Exchange (Binance, MB, etc.)</option>
                      <option value="SELF_CUSTODY_HARDWARE">Hardware Wallet (Ledger/Trezor)</option>
                      <option value="SELF_CUSTODY_HOT">Hot Wallet (Metamask/Phantom)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Taxa de Rede (Gas fee)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={crTaxaRede}
                      onChange={(e) => setCrTaxaRede(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 5. FUNDOS DE INVESTIMENTO */}
            {activeGroup === 'FUNDOS' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-300 mb-1">
                      Nome do Fundo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Alaska Black FIC FIA"
                      value={fundoNome}
                      onChange={(e) => {
                        setFundoNome(e.target.value);
                        if (!name) setName(e.target.value);
                      }}
                      className="w-full bg-slate-800 border border-indigo-500/40 rounded-xl px-2.5 py-1.5 text-indigo-300 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      CNPJ do Fundo
                    </label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={fundoCnpj}
                      onChange={(e) => setFundoCnpj(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Classe
                    </label>
                    <select
                      value={fundoClasse}
                      onChange={(e) => setFundoClasse(e.target.value as FundoClasse)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                    >
                      <option value="MULTIMERCADO">Multimercado</option>
                      <option value="ACOES">Ações</option>
                      <option value="RENDA_FIXA">Renda Fixa</option>
                      <option value="CAMBIAL">Cambial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Resgate (Cotização)
                    </label>
                    <input
                      type="number"
                      placeholder="D+30"
                      value={fundoDcotizacao}
                      onChange={(e) => setFundoDcotizacao(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                    />
                  </div>

                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={fundoComeCotas}
                        onChange={(e) => setFundoComeCotas(e.target.checked)}
                        className="rounded accent-indigo-500 w-3.5 h-3.5"
                      />
                      <span>Come-cotas</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* 6. OUTROS */}
            {activeGroup === 'OUTROS' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nome do Ativo / Investimento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Poupança Caixa, Reserva de Ouro, Previdência Privada"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Core Values: Quantity × Unit Price = Total Invested */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {activeGroup === 'RENDA_VARIAVEL'
                  ? 'Qtd Cotas/Ações'
                  : activeGroup === 'CRIPTO'
                  ? 'Quantidade Decimal'
                  : activeGroup === 'TESOURO_DIRETO'
                  ? 'Frações Títulos'
                  : 'Quantidade'}
              </label>
              <input
                type="number"
                step="any"
                min="0.00000001"
                required
                placeholder="Ex: 100 ou 0.05"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {activeGroup === 'RENDA_VARIAVEL'
                  ? 'Preço Execução (R$)'
                  : activeGroup === 'FUNDOS'
                  ? 'Valor da Cota (R$)'
                  : activeGroup === 'TESOURO_DIRETO'
                  ? 'Preço Unitário (R$)'
                  : 'Preço Pago Unitário (R$)'}
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="R$ 0,00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Cotação Atual (Opcional)
              </label>
              <input
                type="number"
                step="any"
                placeholder="Ex: R$ 38,50"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Dates: Operação & Liquidação */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Data Operação (Execução)
              </label>
              <input
                type="date"
                required
                value={dataOperacao}
                onChange={(e) => setDataOperacao(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Data Liquidação</span>
                <span className="text-[10px] text-slate-400">Ex: D+2</span>
              </label>
              <input
                type="date"
                value={dataLiquidacao}
                onChange={(e) => setDataLiquidacao(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Live Calculated Summary Box */}
          <div className="bg-slate-950/80 border border-teal-500/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Valor Bruto:</span>
              <span className="font-semibold text-slate-200">
                {formatCurrency(valorBruto)}
              </span>
            </div>

            {totalFees > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Taxas / Emolumentos:</span>
                <span className="text-amber-400">+{formatCurrency(totalFees)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1">
                <span className="font-bold text-white">Valor Líquido Total:</span>
                <span className="text-[10px] text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                  PM: {formatCurrency(precoMedioCalculado)}
                </span>
              </div>
              <span className="font-bold text-teal-400 text-sm">
                {formatCurrency(valorLiquido)}
              </span>
            </div>

            {parsedCurrentPrice > 0 && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 text-slate-300">
                <span>Patrimônio Atual Estimado:</span>
                <div className="text-right">
                  <span className="font-semibold text-white">
                    {formatCurrency(currentTotalValue)}
                  </span>
                  <span
                    className={`ml-1.5 text-[11px] font-bold ${
                      profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ({profitLoss >= 0 ? '+' : ''}
                    {profitLossPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Observações / Tese
            </label>
            <textarea
              rows={2}
              placeholder="Estratégia, preço alvo, dividend yield esperado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          {/* Debit from monthly cash flow */}
          {!assetToEdit && tipoOperacao === 'COMPRA' && (
            <div className="p-3 bg-teal-950/30 border border-teal-500/30 rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={debitFromBudget}
                  onChange={(e) => setDebitFromBudget(e.target.checked)}
                  className="rounded accent-teal-500 w-4 h-4 mt-0.5 shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-teal-300 block">
                    Debitar do Fluxo de Caixa ({selectedMonth})
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Cria automaticamente uma despesa na categoria &quot;Investimentos&quot; para manter seu saldo mensal real.
                  </p>
                </div>
              </label>

              {debitFromBudget && (
                <div className="pt-1.5 flex items-center gap-2">
                  <span className="text-[11px] text-slate-300 shrink-0">
                    Origem do dinheiro:
                  </span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-900 border border-teal-500/40 rounded-lg px-2 py-1 text-xs text-teal-200"
                  >
                    <option value="Pix">Pix / Saldo em Conta</option>
                    <option value="Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={valorBruto <= 0}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 active:scale-95 transition shadow-lg shadow-teal-900/30 disabled:opacity-50 disabled:pointer-events-none"
            >
              {assetToEdit ? 'Salvar Alterações' : 'Registrar Investimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
