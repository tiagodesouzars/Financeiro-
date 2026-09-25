import React, { useState, useMemo } from 'react';
import {
  X,
  Scale,
  Sparkles,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { InvestmentAsset, InvestmentCategoryGroup } from '../types';
import { formatCurrency } from '../utils/formatters';

interface InvestmentRebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: InvestmentAsset[];
}

interface TargetGroupConfig {
  key: InvestmentCategoryGroup;
  label: string;
  color: string;
  targetPercent: number;
}

const DEFAULT_TARGETS: TargetGroupConfig[] = [
  { key: 'RENDA_FIXA', label: 'Renda Fixa (CDB/LCI/LCA)', color: '#3b82f6', targetPercent: 35 },
  { key: 'TESOURO_DIRETO', label: 'Tesouro Direto', color: '#10b981', targetPercent: 25 },
  { key: 'FUNDOS', label: 'FIIs / Fundos Imobiliários', color: '#f59e0b', targetPercent: 20 },
  { key: 'RENDA_VARIAVEL', label: 'Ações / Renda Variável', color: '#8b5cf6', targetPercent: 15 },
  { key: 'CRIPTO', label: 'Criptomoedas', color: '#f97316', targetPercent: 5 },
];

export const InvestmentRebalanceModal: React.FC<InvestmentRebalanceModalProps> = ({
  isOpen,
  onClose,
  investments,
}) => {
  const [contributionAmount, setContributionAmount] = useState<number>(1000);
  const [targets, setTargets] = useState<TargetGroupConfig[]>(() => {
    const saved = localStorage.getItem('fp_rebalance_targets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_TARGETS;
  });

  if (!isOpen) return null;

  // Calculate current allocation by group
  const currentAllocation = useMemo(() => {
    const groupTotals: Record<string, number> = {
      RENDA_FIXA: 0,
      TESOURO_DIRETO: 0,
      FUNDOS: 0,
      RENDA_VARIAVEL: 0,
      CRIPTO: 0,
    };

    let totalPortfolio = 0;

    investments.forEach((inv) => {
      const val =
        typeof inv.currentTotalValue === 'number' && inv.currentTotalValue > 0
          ? inv.currentTotalValue
          : inv.totalInvested || 0;
      totalPortfolio += val;

      const group = inv.categoria_ativo || 'RENDA_FIXA';
      if (groupTotals[group] !== undefined) {
        groupTotals[group] += val;
      } else {
        groupTotals.RENDA_FIXA += val;
      }
    });

    return { groupTotals, totalPortfolio };
  }, [investments]);

  const totalTargetPercent = targets.reduce((sum, t) => sum + t.targetPercent, 0);

  // Calculate suggested contribution distribution
  const rebalancePlan = useMemo(() => {
    const newTotal = currentAllocation.totalPortfolio + contributionAmount;
    if (newTotal <= 0) return [];

    return targets.map((t) => {
      const currentVal = currentAllocation.groupTotals[t.key] || 0;
      const currentPct = currentAllocation.totalPortfolio > 0
        ? (currentVal / currentAllocation.totalPortfolio) * 100
        : 0;
      const idealTargetValue = (newTotal * t.targetPercent) / 100;
      const deficit = Math.max(0, idealTargetValue - currentVal);

      return {
        ...t,
        currentVal,
        currentPct,
        idealTargetValue,
        deficit,
      };
    });
  }, [currentAllocation, targets, contributionAmount]);

  // Allocate contribution proportionally to categories with highest deficit
  const finalSuggestions = useMemo(() => {
    const totalDeficit = rebalancePlan.reduce((sum, item) => sum + item.deficit, 0);

    return rebalancePlan.map((item) => {
      let suggestedContribution = 0;
      if (totalDeficit > 0 && item.deficit > 0) {
        suggestedContribution = (item.deficit / totalDeficit) * contributionAmount;
      } else if (item.targetPercent > 0) {
        suggestedContribution = (item.targetPercent / 100) * contributionAmount;
      }

      const postVal = item.currentVal + suggestedContribution;
      const newPortfolioTotal = currentAllocation.totalPortfolio + contributionAmount;
      const postPct = newPortfolioTotal > 0 ? (postVal / newPortfolioTotal) * 100 : 0;

      return {
        ...item,
        suggestedContribution: Math.round(suggestedContribution * 100) / 100,
        postVal,
        postPct,
      };
    });
  }, [rebalancePlan, contributionAmount, currentAllocation]);

  const updateTargetPercent = (key: InvestmentCategoryGroup, percent: number) => {
    setTargets((prev) => {
      const updated = prev.map((t) => (t.key === key ? { ...t, targetPercent: percent } : t));
      localStorage.setItem('fp_rebalance_targets', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Calculadora de Rebalanceamento</h2>
              <p className="text-xs text-slate-400">Direcione novos aportes para equilibrar seu patrimônio</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Contribution input card */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 block">Novo Aporte Planejado:</span>
              <span className="text-xs text-slate-500">Valor que você irá investir neste momento</span>
            </div>
            <div className="relative w-full sm:w-48">
              <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">R$</span>
              <input
                type="number"
                min="0"
                step="50"
                value={contributionAmount || ''}
                onChange={(e) => setContributionAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                placeholder="1000"
              />
            </div>
          </div>

          {/* Target percentage verification */}
          {totalTargetPercent !== 100 && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
              <span>A soma das metas atuais é {totalTargetPercent}%. Ajuste para totalizar 100%.</span>
            </div>
          )}

          {/* Allocation Table & Sliders */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Alocação Atual vs. Meta Ideal
            </h3>

            <div className="space-y-2.5">
              {finalSuggestions.map((item) => (
                <div
                  key={item.key}
                  className="p-3.5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-bold text-slate-200">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Meta:</span>
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.targetPercent}
                          onChange={(e) =>
                            updateTargetPercent(item.key, parseInt(e.target.value, 10) || 0)
                          }
                          className="w-8 text-right bg-transparent text-xs font-bold text-white focus:outline-none"
                        />
                        <span className="text-xs text-slate-400 ml-0.5">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress comparisons */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block">Posição Atual:</span>
                      <span className="font-semibold text-slate-300">
                        {formatCurrency(item.currentVal)} ({item.currentPct.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-indigo-400 font-bold block">Aporte Sugerido:</span>
                      <span className="text-xs font-extrabold text-emerald-400">
                        +{formatCurrency(item.suggestedContribution)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 block">Pós-Aporte:</span>
                      <span className="font-semibold text-slate-300">
                        {item.postPct.toFixed(1)}% / {item.targetPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Metas salvas automaticamente
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
