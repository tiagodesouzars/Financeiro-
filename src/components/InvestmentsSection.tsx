import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  PieChart,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Calendar,
  Trash2,
  Edit2,
  Sparkles,
  Info,
  DollarSign,
  Layers,
  Landmark,
  ShieldCheck,
  Briefcase,
  Clock,
  CheckCircle2,
  Scale,
  Flame,
} from 'lucide-react';
import {
  InvestmentAsset,
  InvestmentCategoryGroup,
  InvestmentStats,
} from '../types';
import {
  formatCurrency,
  formatStockQuantity,
  formatDateBR,
  INVESTMENT_CATEGORY_GROUP_INFO,
  OPERATION_TYPE_LABELS,
  INVESTMENT_CATEGORY_COLORS,
} from '../utils/formatters';

const InvestmentEvolutionChart = React.lazy(() =>
  import('./InvestmentEvolutionChart').then((m) => ({ default: m.InvestmentEvolutionChart }))
);

interface InvestmentsSectionProps {
  investments: InvestmentAsset[];
  investmentStats: InvestmentStats;
  selectedMonth: string;
  onOpenAddModal: () => void;
  onEditAsset: (asset: InvestmentAsset) => void;
  onDeleteAsset: (id: string) => void;
  onOpenRebalance?: () => void;
  onOpenFireSimulator?: () => void;
}

export const InvestmentsSection: React.FC<InvestmentsSectionProps> = ({
  investments,
  investmentStats,
  selectedMonth,
  onOpenAddModal,
  onEditAsset,
  onDeleteAsset,
  onOpenRebalance,
  onOpenFireSimulator,
}) => {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assetToDelete, setAssetToDelete] = useState<InvestmentAsset | null>(null);

  // Filter investments
  const filteredInvestments = investments.filter((inv) => {
    const matchesGroup =
      selectedGroupFilter === 'all' || inv.categoria_ativo === selectedGroupFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      inv.name.toLowerCase().includes(q) ||
      (inv.institution && inv.institution.toLowerCase().includes(q)) ||
      (inv.category && inv.category.toLowerCase().includes(q)) ||
      (inv.detalhes_renda_variavel?.ticker &&
        inv.detalhes_renda_variavel.ticker.toLowerCase().includes(q)) ||
      (inv.detalhes_renda_fixa?.emissor &&
        inv.detalhes_renda_fixa.emissor.toLowerCase().includes(q)) ||
      (inv.detalhes_cripto?.symbol &&
        inv.detalhes_cripto.symbol.toLowerCase().includes(q));
    return matchesGroup && matchesQuery;
  });

  return (
    <div className="space-y-4">
      {/* Header & Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            Carteira de Investimentos
          </h2>
          <p className="text-xs text-slate-400">
            Ações, Renda Fixa, Tesouro, Cripto e Fundos
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenRebalance && (
            <button
              onClick={onOpenRebalance}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 text-xs font-semibold rounded-xl border border-slate-700/80 flex items-center gap-1 active:scale-95 transition-all shadow-sm"
              title="Calculadora de Rebalanceamento de Carteira"
            >
              <Scale className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rebalancear</span>
            </button>
          )}

          {onOpenFireSimulator && (
            <button
              onClick={onOpenFireSimulator}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-amber-300 text-xs font-semibold rounded-xl border border-slate-700/80 flex items-center gap-1 active:scale-95 transition-all shadow-sm"
              title="Simulador de Independência Financeira"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">FIRE</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Aporte
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Portfolio Value */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-850 p-3.5 rounded-2xl border border-slate-700/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Patrimônio Total
          </span>
          <p className="text-lg font-extrabold text-white mt-0.5">
            {formatCurrency(investmentStats.currentTotalValue)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px]">
            {investmentStats.totalProfitLoss >= 0 ? (
              <span className="text-emerald-400 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                +{investmentStats.totalProfitLossPercent.toFixed(1)}%
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center">
                <ArrowDownRight className="w-3 h-3" />
                {investmentStats.totalProfitLossPercent.toFixed(1)}%
              </span>
            )}
            <span className="text-slate-500 font-medium">
              ({formatCurrency(investmentStats.totalProfitLoss)})
            </span>
          </div>
        </div>

        {/* Money Transformed into Investment this month */}
        <div className="bg-gradient-to-br from-teal-950/60 to-slate-800 p-3.5 rounded-2xl border border-teal-500/30 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
            Virou Investimento no Mês
          </span>
          <p className="text-lg font-extrabold text-teal-400 mt-0.5">
            {formatCurrency(investmentStats.monthlyInvestedAmount)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>Fluxo transformado em ativos</span>
          </div>
        </div>
      </div>

      {/* 6-Month Portfolio Evolution Chart */}
      <React.Suspense
        fallback={
          <div className="h-44 bg-slate-850/60 rounded-2xl animate-pulse flex items-center justify-center text-xs text-slate-500">
            Carregando gráfico de evolução...
          </div>
        }
      >
        <InvestmentEvolutionChart
          investments={investments}
          investmentStats={investmentStats}
          selectedMonth={selectedMonth}
          onOpenAddModal={onOpenAddModal}
        />
      </React.Suspense>

      {/* Asset Class Allocation Bar */}
      {investmentStats.groupAllocation && investmentStats.groupAllocation.length > 0 && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-teal-400" />
              Alocação por Classe de Ativo
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {investmentStats.assetCount} {investmentStats.assetCount === 1 ? 'posição' : 'posições'}
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
            {investmentStats.groupAllocation.map((item) => (
              <div
                key={item.group}
                title={`${item.label}: ${formatCurrency(item.amount)} (${item.percent.toFixed(1)}%)`}
                style={{
                  width: `${item.percent}%`,
                  backgroundColor: item.color,
                }}
                className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              />
            ))}
          </div>

          {/* Legend Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {investmentStats.groupAllocation.map((item) => (
              <div
                key={item.group}
                className="flex items-center gap-1 text-[10px] bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-700/60"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300 font-medium">{item.label}</span>
                <span className="text-slate-400 font-bold">{item.percent.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, ativo, emissor, corretora..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Asset Class Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedGroupFilter('all')}
            className={`px-3 py-1 rounded-xl font-medium shrink-0 transition-all ${
              selectedGroupFilter === 'all'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({investments.length})
          </button>

          {(
            [
              ['RENDA_VARIAVEL', 'Renda Variável'],
              ['RENDA_FIXA', 'Renda Fixa'],
              ['TESOURO_DIRETO', 'Tesouro'],
              ['CRIPTO', 'Cripto'],
              ['FUNDOS', 'Fundos'],
              ['OUTROS', 'Outros'],
            ] as const
          ).map(([key, label]) => {
            const count = investments.filter((i) => i.categoria_ativo === key).length;
            if (count === 0 && investments.length > 0) return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedGroupFilter(key)}
                className={`px-3 py-1 rounded-xl font-medium shrink-0 transition-all ${
                  selectedGroupFilter === key
                    ? 'bg-teal-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Assets List */}
      <div className="space-y-3">
        {filteredInvestments.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">
                Nenhum investimento encontrado
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cadastre suas ações, CDBs, Tesouro Direto ou cripto para acompanhar seu patrimônio.
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Primeiro Investimento
            </button>
          </div>
        ) : (
          filteredInvestments.map((inv) => {
            const hasCurrentPrice =
              typeof inv.currentPrice === 'number' && inv.currentPrice > 0;
            const currentTotal =
              hasCurrentPrice && inv.quantity > 0
                ? inv.quantity * (inv.currentPrice || 0)
                : inv.currentTotalValue || inv.totalInvested;
            const itemProfit = currentTotal - inv.totalInvested;
            const itemProfitPercent =
              inv.totalInvested > 0 ? (itemProfit / inv.totalInvested) * 100 : 0;

            const groupInfo =
              INVESTMENT_CATEGORY_GROUP_INFO[inv.categoria_ativo || 'OUTROS'] ||
              INVESTMENT_CATEGORY_GROUP_INFO.OUTROS;
            const opInfo =
              OPERATION_TYPE_LABELS[inv.tipo_operacao || 'COMPRA'] ||
              OPERATION_TYPE_LABELS.COMPRA;

            return (
              <div
                key={inv.id}
                className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3.5 transition-all shadow-sm space-y-2.5"
              >
                {/* Header: Title, Badges, Operation & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <h3 className="text-sm font-extrabold text-white tracking-tight truncate">
                        {inv.name}
                      </h3>

                      {/* Group badge */}
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{
                          backgroundColor: `${groupInfo.color}20`,
                          color: groupInfo.color,
                          border: `1px solid ${groupInfo.color}40`,
                        }}
                      >
                        {groupInfo.label}
                      </span>

                      {/* Operation badge */}
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{
                          backgroundColor: `${opInfo.color}20`,
                          color: opInfo.color,
                        }}
                      >
                        {opInfo.label}
                      </span>

                      {/* Currency badge if not BRL */}
                      {inv.moeda && inv.moeda !== 'BRL' && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-bold rounded">
                          {inv.moeda}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      {inv.institution && (
                        <span className="flex items-center gap-1 font-medium">
                          <Building className="w-3 h-3 text-slate-500 shrink-0" />
                          {inv.institution}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                        {formatDateBR(inv.data_operacao || inv.purchaseDate)}
                      </span>
                      {inv.data_liquidacao && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3 shrink-0" />
                          Liq: {formatDateBR(inv.data_liquidacao)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profit badge if current price available */}
                  {hasCurrentPrice && (
                    <div
                      className={`px-2 py-1 rounded-lg text-right text-[11px] font-bold shrink-0 ${
                        itemProfit >= 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      <p>
                        {itemProfit >= 0 ? '+' : ''}
                        {formatCurrency(itemProfit)}
                      </p>
                      <p className="text-[10px] font-medium">
                        {itemProfit >= 0 ? '+' : ''}
                        {itemProfitPercent.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Polymorphic Details Badges */}
                {inv.detalhes_renda_variavel && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 bg-purple-950/60 border border-purple-500/40 text-purple-300 rounded-md font-mono font-bold">
                      {inv.detalhes_renda_variavel.ticker} ({inv.detalhes_renda_variavel.tipo_ativo})
                    </span>
                    {inv.detalhes_renda_variavel.setor_atuacao && (
                      <span className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded-md">
                        Setor: {inv.detalhes_renda_variavel.setor_atuacao}
                      </span>
                    )}
                    {(inv.detalhes_renda_variavel.taxa_corretagem || 0) +
                      (inv.detalhes_renda_variavel.emolumentos_b3 || 0) >
                      0 && (
                      <span className="px-2 py-0.5 bg-slate-900 text-slate-400 rounded-md">
                        Taxas: {formatCurrency(
                          (inv.detalhes_renda_variavel.taxa_corretagem || 0) +
                            (inv.detalhes_renda_variavel.emolumentos_b3 || 0)
                        )}
                      </span>
                    )}
                  </div>
                )}

                {inv.detalhes_renda_fixa && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 bg-blue-950/60 border border-blue-500/40 text-blue-300 rounded-md font-bold">
                      {inv.detalhes_renda_fixa.tipo_ativo} · {inv.detalhes_renda_fixa.taxa_pactuada}% {inv.detalhes_renda_fixa.indexador}
                    </span>
                    {inv.detalhes_renda_fixa.isento_ir && (
                      <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-md font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Isento de IR
                      </span>
                    )}
                    {inv.detalhes_renda_fixa.data_vencimento && (
                      <span className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded-md">
                        Vence: {formatDateBR(inv.detalhes_renda_fixa.data_vencimento)}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-slate-900 text-slate-400 rounded-md">
                      Liq: {inv.detalhes_renda_fixa.liquidez === 'DIARIA' ? 'Diária' : 'Vencimento'}
                    </span>
                  </div>
                )}

                {inv.detalhes_tesouro && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-md font-bold">
                      {inv.detalhes_tesouro.tipo_titulo.replace(/_/g, ' ')} {inv.detalhes_tesouro.ano_vencimento}
                    </span>
                    {inv.detalhes_tesouro.pagamento_cupom && (
                      <span className="px-2 py-0.5 bg-teal-950/60 border border-teal-500/40 text-teal-300 rounded-md font-semibold">
                        Com Juros Semestrais (Cupom)
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-slate-900 text-slate-400 rounded-md">
                      Custódia B3: {inv.detalhes_tesouro.taxa_b3}%
                    </span>
                  </div>
                )}

                {inv.detalhes_cripto && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 bg-orange-950/60 border border-orange-500/40 text-orange-300 rounded-md font-mono font-bold">
                      {inv.detalhes_cripto.symbol} · {inv.detalhes_cripto.rede_blockchain}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded-md">
                      Custódia: {inv.detalhes_cripto.custodia}
                    </span>
                  </div>
                )}

                {inv.detalhes_fundos && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 rounded-md font-bold">
                      Fundo {inv.detalhes_fundos.classe_fundo}
                    </span>
                    {inv.detalhes_fundos.cnpj_fundo && (
                      <span className="px-2 py-0.5 bg-slate-900 text-slate-400 rounded-md font-mono">
                        {inv.detalhes_fundos.cnpj_fundo}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded-md">
                      Cotização: D+{inv.detalhes_fundos.prazo_cotizacao_resgate}
                    </span>
                    {inv.detalhes_fundos.come_cotas && (
                      <span className="px-2 py-0.5 bg-amber-950/60 text-amber-300 rounded-md">
                        Come-cotas
                      </span>
                    )}
                  </div>
                )}

                {/* Details Grid: Quantity, Unit Price / PM, Total Invested */}
                <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-750 text-center">
                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase">
                      {inv.categoria_ativo === 'CRIPTO' ? 'Qtd. Tokens' : 'Quantidade'}
                    </span>
                    <p className="text-xs font-bold text-slate-200 mt-0.5 font-mono">
                      {formatStockQuantity(inv.quantity)}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase">
                      Preço Médio (PM)
                    </span>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">
                      {formatCurrency(inv.purchasePrice)}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase">
                      Total Investido
                    </span>
                    <p className="text-xs font-extrabold text-teal-400 mt-0.5">
                      {formatCurrency(inv.totalInvested)}
                    </p>
                  </div>
                </div>

                {/* Notes if any */}
                {inv.notes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-800/40 px-2.5 py-1.5 rounded-lg border border-slate-700/40">
                    &ldquo;{inv.notes}&rdquo;
                  </p>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/50 text-xs">
                  <span className="text-[10px] text-slate-500">
                    {hasCurrentPrice
                      ? `Cotação atual: ${formatCurrency(inv.currentPrice || 0)}`
                      : 'Patrimônio calculado pelo valor aplicado'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditAsset(inv)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                      title="Editar detalhes do investimento"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      id={`delete-asset-btn-${inv.id}`}
                      onClick={() => setAssetToDelete(inv)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                      title="Remover ativo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Deleting Investment */}
      {assetToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Excluir Investimento</h4>
                <p className="text-xs text-slate-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-750">
              Deseja remover <strong className="text-white">{assetToDelete.name}</strong> ({formatCurrency(assetToDelete.totalInvested)}) da sua carteira?
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                id="cancel-delete-asset-btn"
                onClick={() => setAssetToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-delete-asset-btn"
                onClick={() => {
                  onDeleteAsset(assetToDelete.id);
                  setAssetToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
