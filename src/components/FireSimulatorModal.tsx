import React, { useState, useMemo } from 'react';
import {
  X,
  Flame,
  TrendingUp,
  Target,
  Calendar,
  Sparkles,
  Info,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface FireSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNetWorth: number;
}

export const FireSimulatorModal: React.FC<FireSimulatorModalProps> = ({
  isOpen,
  onClose,
  currentNetWorth,
}) => {
  const [initialCapital, setInitialCapital] = useState<number>(currentNetWorth || 25000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(1500);
  const [monthlyExpensesDesired, setMonthlyExpensesDesired] = useState<number>(5000);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState<number>(4.0); // 4% rule
  const [annualRealReturn, setAnnualRealReturn] = useState<number>(7.0); // 7% real return (above inflation)

  if (!isOpen) return null;

  // FIRE calculations
  const annualExpenses = monthlyExpensesDesired * 12;
  const fireNumber = safeWithdrawalRate > 0 ? annualExpenses / (safeWithdrawalRate / 100) : 0;

  // Monthly compound interest simulation to reach FIRE number
  const projection = useMemo(() => {
    const monthlyRate = Math.pow(1 + annualRealReturn / 100, 1 / 12) - 1;
    let balance = initialCapital;
    let months = 0;
    const maxMonths = 600; // 50 years max cap

    const milestones: { year: number; balance: number; contributed: number }[] = [
      { year: 0, balance: initialCapital, contributed: initialCapital },
    ];
    let totalContributed = initialCapital;

    while (balance < fireNumber && months < maxMonths) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      totalContributed += monthlyContribution;
      months++;

      if (months % 12 === 0 || balance >= fireNumber) {
        milestones.push({
          year: Math.round(months / 12),
          balance: Math.round(balance),
          contributed: Math.round(totalContributed),
        });
      }
    }

    const yearsToFire = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const reached = balance >= fireNumber;

    return {
      months,
      yearsToFire,
      remainingMonths,
      reached,
      milestones: milestones.slice(0, 15), // show first 15 checkpoints
      finalBalance: balance,
    };
  }, [initialCapital, monthlyContribution, annualRealReturn, fireNumber]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Simulador de Independência Financeira (FIRE)</h2>
              <p className="text-xs text-slate-400">Calcule seu patrimônio alvo e prazo para viver de renda</p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Main Highlights Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-slate-900 border border-amber-500/30">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Patrimônio FIRE Necessário
              </span>
              <div className="text-2xl font-black text-white">
                {formatCurrency(fireNumber)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Baseado na regra dos 4% (25× custo de vida anual de {formatCurrency(annualExpenses)})
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-slate-900 border border-emerald-500/30">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Tempo Estimado para o FIRE
              </span>
              <div className="text-2xl font-black text-white">
                {projection.reached
                  ? `${projection.yearsToFire} anos e ${projection.remainingMonths} meses`
                  : 'Mais de 40 anos'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Com aportes mensais constantes de {formatCurrency(monthlyContribution)}
              </p>
            </div>
          </div>

          {/* Configuration Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-800/30 border border-slate-800">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Custo de Vida Mensal Desejado:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                <input
                  type="number"
                  min="500"
                  step="250"
                  value={monthlyExpensesDesired}
                  onChange={(e) => setMonthlyExpensesDesired(Math.max(100, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Aporte Mensal Recorrente:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Patrimônio Inicial Acumulado:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Rentabilidade Real Anual (% acima da inflação):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="0.5"
                  value={annualRealReturn}
                  onChange={(e) => setAnnualRealReturn(parseFloat(e.target.value) || 6)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400">% a.a.</span>
              </div>
            </div>
          </div>

          {/* Growth Timeline Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Curva de Juros Compostos & Marcos de Crescimento
            </h3>

            <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-[11px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Prazo</th>
                    <th className="py-2 px-3">Total Investido</th>
                    <th className="py-2 px-3 text-right">Patrimônio com Juros</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {projection.milestones.map((m) => {
                    const isFire = m.balance >= fireNumber;
                    return (
                      <tr key={m.year} className={isFire ? 'bg-amber-500/10 font-bold' : ''}>
                        <td className="py-2 px-3 text-slate-300">
                          Ano {m.year}
                          {isFire && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] uppercase font-black">
                              FIRE Atingido!
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-400">{formatCurrency(m.contributed)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                          {formatCurrency(m.balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Valores corrigidos pela inflação real
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
          >
            Fechar Simulador
          </button>
        </div>
      </div>
    </div>
  );
};
