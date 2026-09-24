import React, { useState } from 'react';
import {
  PiggyBank,
  Target,
  Plus,
  Shield,
  Plane,
  Smartphone,
  Car,
  Home,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  X,
  Trash2,
} from 'lucide-react';
import { SavingsGoal, UserFinancialProfile } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SavingsGoalsSectionProps {
  goals: SavingsGoal[];
  availableBudget: number;
  projectedSavings: number;
  savingsRate: number;
  onUpdateGoals: (goals: SavingsGoal[]) => void;
  onDepositGoal: (goalId: string, amount: number) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Shield,
  Plane,
  Smartphone,
  Car,
  Home,
  PiggyBank,
  Target,
};

export const SavingsGoalsSection: React.FC<SavingsGoalsSectionProps> = ({
  goals,
  availableBudget,
  projectedSavings,
  savingsRate,
  onUpdateGoals,
  onDepositGoal,
}) => {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [newCurrentAmount, setNewCurrentAmount] = useState('');
  const [newIcon, setNewIcon] = useState('PiggyBank');
  const [newColor, setNewColor] = useState('#10b981');

  // Quick Deposit modal state
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');

  // Delete Goal state
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  const handleConfirmDelete = () => {
    if (!goalToDelete) return;
    onUpdateGoals(goals.filter((g) => g.id !== goalToDelete.id));
    setGoalToDelete(null);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newTargetAmount.replace(',', '.'));
    const current = parseFloat(newCurrentAmount.replace(',', '.')) || 0;

    if (!newTitle.trim() || isNaN(target) || target <= 0) return;

    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      title: newTitle.trim(),
      targetAmount: target,
      currentAmount: current,
      icon: newIcon,
      color: newColor,
      autoAllocationPriority: goals.length + 1,
    };

    onUpdateGoals([...goals, newGoal]);
    setIsAddingGoal(false);
    setNewTitle('');
    setNewTargetAmount('');
    setNewCurrentAmount('');
  };

  const handleExecuteAutoSavings = () => {
    if (projectedSavings <= 0 || goals.length === 0) return;

    // Distribute suggested savings among top priority goals
    const portion = projectedSavings / goals.length;
    const updated = goals.map((g) => ({
      ...g,
      currentAmount: Math.min(g.targetAmount, g.currentAmount + portion),
    }));

    onUpdateGoals(updated);
  };

  const handleManualDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const val = parseFloat(depositAmount.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      onDepositGoal(depositGoalId, val);
      setDepositGoalId(null);
      setDepositAmount('');
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              Metas Automáticas de Economia
            </h2>
            <p className="text-[11px] text-slate-400">
              {goals.length} objetivos cadastrados
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddingGoal(true)}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg transition-colors active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Meta
        </button>
      </div>

      {/* Automatic Budget Engine Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-xl p-3 mb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sugestão Baseada no Seu Orçamento
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Com seu orçamento livre de{' '}
              <strong className="text-white">{formatCurrency(availableBudget)}</strong>,
              você pode guardar{' '}
              <strong className="text-emerald-400">
                {formatCurrency(projectedSavings)}
              </strong>{' '}
              ({savingsRate}% do livre) este mês sem comprometer suas contas.
            </p>
          </div>

          {projectedSavings > 0 && (
            <button
              onClick={handleExecuteAutoSavings}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow-sm active:scale-95 transition-all mt-1"
              title="Aportar economia recomendada nas metas"
            >
              <TrendingUp className="w-3 h-3" />
              Guardar Agora
            </button>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="mt-2.5 pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px] text-slate-400">
          <span>Total Poupado: <strong className="text-slate-200">{formatCurrency(totalSaved)}</strong></span>
          <span className="font-semibold text-indigo-300">{overallProgress}% da meta global</span>
        </div>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-6 px-4 border border-dashed border-slate-700/80 rounded-xl bg-slate-900/40">
          <PiggyBank className="w-8 h-8 text-indigo-400/60 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-200">Nenhuma meta cadastrada</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Defina objetivos como Reserva de Emergência, Viagens ou Carro/Casa.
          </p>
          <button
            type="button"
            onClick={() => setIsAddingGoal(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const IconComp = ICON_MAP[goal.icon] || Target;
            const progressPercent = Math.min(
              100,
              Math.round((goal.currentAmount / goal.targetAmount) * 100)
            );
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            // Estimate months left if auto-savings portion is applied
            const monthlyPortion = projectedSavings / Math.max(1, goals.length);
            const monthsLeft =
              monthlyPortion > 0 ? Math.ceil(remaining / monthlyPortion) : null;

            return (
              <div
                key={goal.id}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${goal.color}20`,
                        color: goal.color,
                        border: `1px solid ${goal.color}40`,
                      }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-100 truncate">
                        {goal.title}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {formatCurrency(goal.currentAmount)} de{' '}
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className="text-xs font-extrabold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${goal.color}25`,
                        color: goal.color,
                      }}
                    >
                      {progressPercent}%
                    </span>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setDepositGoalId(goal.id);
                          setDepositAmount('');
                        }}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition"
                      >
                        + Aportar
                      </button>
                      <button
                        type="button"
                        title="Excluir esta meta"
                        onClick={() => setGoalToDelete(goal)}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                </div>

                {/* Projection Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                  <span>Faltam {formatCurrency(remaining)}</span>
                  {monthsLeft !== null && remaining > 0 && (
                    <span className="text-emerald-400 font-medium">
                      ~{monthsLeft} meses no ritmo atual
                    </span>
                  )}
                  {remaining === 0 && (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Meta Concluída!
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Quick Deposit Modal */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100">
                Aportar na Meta
              </h3>
              <button
                onClick={() => setDepositGoalId(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualDeposit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor do Aporte (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  autoFocus
                  placeholder="0,00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex gap-2">
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(String(amt))}
                    className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700"
                  >
                    +R$ {amt}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Goal Modal */}
      {isAddingGoal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-400" />
                Criar Nova Meta de Economia
              </h3>
              <button
                onClick={() => setIsAddingGoal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Objetivo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Viagem de Fim de Ano, Carro Novo"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meta Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="5000.00"
                    value={newTargetAmount}
                    onChange={(e) => setNewTargetAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Já Guardado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newCurrentAmount}
                    onChange={(e) => setNewCurrentAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Icon selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ícone Representativo
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'PiggyBank', icon: PiggyBank },
                    { id: 'Shield', icon: Shield },
                    { id: 'Plane', icon: Plane },
                    { id: 'Car', icon: Car },
                    { id: 'Home', icon: Home },
                    { id: 'Smartphone', icon: Smartphone },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setNewIcon(item.id)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          newIcon === item.id
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cor de Destaque
                </label>
                <div className="flex gap-2.5">
                  {['#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          newColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-80'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Goal Confirmation Modal */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Excluir Meta</h3>
                <p className="text-[11px] text-slate-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 mb-4 leading-relaxed">
              Deseja realmente remover a meta <strong className="text-white font-semibold">"{goalToDelete.title}"</strong> com saldo poupado de <strong className="text-emerald-400">{formatCurrency(goalToDelete.currentAmount)}</strong>?
            </p>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setGoalToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition shadow-sm active:scale-95"
              >
                Sim, Excluir Meta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
