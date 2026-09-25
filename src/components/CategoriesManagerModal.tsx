import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  Tag,
  ArrowDownRight,
  ArrowUpRight,
  Palette,
  AlertCircle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  Zap,
  Info,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CustomCategory,
  TransactionType,
  Transaction,
  UserFinancialProfile,
  FixedBill,
} from '../types';
import {
  PRESET_CATEGORY_COLORS,
  formatCurrency,
  getCurrentMonthKey,
  formatMonthYearPT,
} from '../utils/formatters';
import { resetDefaultCategories } from '../utils/storage';
import {
  analyzeSpendingPatternsAndRecommendBudgets,
  applyAllRecommendedBudgets,
  OverallSpendingPatternAnalysis,
} from '../utils/categoryBudgetAnalysis';

interface CategoriesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CustomCategory[];
  onUpdateCategories: (categories: CustomCategory[]) => void;
  initialType?: TransactionType;
  transactions?: Transaction[];
  profile?: UserFinancialProfile;
  bills?: FixedBill[];
  selectedMonth?: string;
}

export const CategoriesManagerModal: React.FC<CategoriesManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategories,
  initialType = 'expense',
  transactions = [],
  profile,
  bills = [],
  selectedMonth,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>(initialType);

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_CATEGORY_COLORS[0]);
  const [newCatBudgetLimit, setNewCatBudgetLimit] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editing category state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editBudgetLimit, setEditBudgetLimit] = useState('');

  // Confirmation states
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);

  // Month reference
  const currentMonthKey = selectedMonth || getCurrentMonthKey();

  // Spending pattern analysis & recommended budgets
  const overallAnalysis = useMemo<OverallSpendingPatternAnalysis>(() => {
    return analyzeSpendingPatternsAndRecommendBudgets(
      categories,
      transactions,
      profile,
      bills,
      currentMonthKey
    );
  }, [categories, transactions, profile, bills, currentMonthKey]);

  // Lookup map for fast recommendation retrieval by category id
  const recMap = useMemo(() => {
    const map = new Map<string, (typeof overallAnalysis.recommendations)[0]>();
    overallAnalysis.recommendations.forEach((r) => map.set(r.categoryId, r));
    return map;
  }, [overallAnalysis.recommendations]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setNewCatName('');
    setNewCatBudgetLimit('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setErrorMsg('Informe o nome da categoria.');
      return;
    }

    // Check duplicate
    const exists = categories.some(
      (c) => c.type === activeTab && c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setErrorMsg(`Já existe uma categoria de ${activeTab === 'expense' ? 'gasto' : 'renda'} com este nome.`);
      return;
    }

    const budgetVal = parseFloat(newCatBudgetLimit.replace(',', '.')) || undefined;

    const newCategory: CustomCategory = {
      id: `cat-${activeTab}-${Date.now()}`,
      name: trimmed,
      type: activeTab,
      color: newCatColor,
      budgetLimit: budgetVal && budgetVal > 0 ? budgetVal : undefined,
      isDefault: false,
      createdAt: Date.now(),
    };

    onUpdateCategories([...categories, newCategory]);
    setNewCatName('');
    setNewCatBudgetLimit('');
    setIsAdding(false);
    setErrorMsg(null);
    setSuccessMsg(`Categoria "${trimmed}" criada com sucesso.`);
  };

  const handleStartEdit = (cat: CustomCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditBudgetLimit(cat.budgetLimit != null ? String(cat.budgetLimit) : '');
    setIsAdding(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) return;

    // Check duplicate with another category
    const exists = categories.some(
      (c) =>
        c.id !== editingId &&
        c.type === activeTab &&
        c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setErrorMsg('Já existe outra categoria com este nome.');
      return;
    }

    const budgetVal = parseFloat(editBudgetLimit.replace(',', '.')) || undefined;

    const updated = categories.map((c) =>
      c.id === editingId
        ? {
            ...c,
            name: trimmed,
            color: editColor,
            budgetLimit: budgetVal && budgetVal > 0 ? budgetVal : undefined,
          }
        : c
    );
    onUpdateCategories(updated);
    setEditingId(null);
    setErrorMsg(null);
    setSuccessMsg(`Categoria "${trimmed}" atualizada.`);
  };

  const handleAdoptRecommendation = (catId: string, recLimit: number) => {
    const updated = categories.map((c) => {
      if (c.id === catId) {
        return {
          ...c,
          budgetLimit: recLimit,
          recommendedBudgetLimit: recLimit,
        };
      }
      return c;
    });
    onUpdateCategories(updated);
    const cat = categories.find((c) => c.id === catId);
    setSuccessMsg(
      `Limite sugerido de ${formatCurrency(recLimit)} adotado para "${cat?.name || 'categoria'}"!`
    );
  };

  const handleApplyAllRecommendations = () => {
    const updated = applyAllRecommendedBudgets(categories, overallAnalysis.recommendations);
    onUpdateCategories(updated);
    setSuccessMsg(
      `Todos os limites recomendados foram aplicados para manter seus gastos dentro das suas posses!`
    );
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (filteredCategories.length <= 1) {
      setErrorMsg('Mantenha ao menos uma categoria cadastrada.');
      return;
    }
    setCatToDelete({ id: catId, name: catName });
  };

  const confirmDeleteCategory = () => {
    if (!catToDelete) return;
    onUpdateCategories(categories.filter((c) => c.id !== catToDelete.id));
    setCatToDelete(null);
    setSuccessMsg(`Categoria removida.`);
  };

  const handleResetDefaults = () => {
    setShowResetConfirm(true);
  };

  const confirmResetDefaults = () => {
    const defaults = resetDefaultCategories();
    onUpdateCategories(defaults);
    setIsAdding(false);
    setEditingId(null);
    setErrorMsg(null);
    setShowResetConfirm(false);
    setSuccessMsg('Categorias padrão restauradas com sucesso.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Gerenciar Categorias & Tetos Orçamentários
              </h2>
              <p className="text-[11px] text-slate-400">
                Personalize categorias e adote limites baseados no seu consumo real
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Gastos vs Rendas */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 mt-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('expense');
              setIsAdding(false);
              setEditingId(null);
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'expense'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            Categorias de Gastos ({categories.filter((c) => c.type === 'expense').length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('income');
              setIsAdding(false);
              setEditingId(null);
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'income'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Categorias de Renda ({categories.filter((c) => c.type === 'income').length})
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mt-2.5 p-2 bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs rounded-xl flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-2.5 p-2 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs rounded-xl flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ×
            </button>
          </div>
        )}

        {/* Spending Pattern Analysis & Budget Recommendation Banner (Expense tab only) */}
        {activeTab === 'expense' && (
          <div className="mt-3 p-3 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Análise de Padrões & Limites Sugeridos</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Calculados para manter suas despesas dentro da renda disponível
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
                className="text-[10px] text-indigo-300 hover:text-indigo-200 flex items-center gap-0.5"
              >
                <span>{showAnalysisDetails ? 'Ocultar' : 'Detalhes'}</span>
                {showAnalysisDetails ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Metrics Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-750">
                <span className="text-[9px] text-slate-400 block font-medium">
                  Orçamento Livre Variável
                </span>
                <span className="text-xs font-bold text-slate-100">
                  {formatCurrency(overallAnalysis.discretionaryBudget)}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-750">
                <span className="text-[9px] text-slate-400 block font-medium">
                  Soma dos Tetos Sugeridos
                </span>
                <span className="text-xs font-bold text-purple-300">
                  {formatCurrency(overallAnalysis.totalRecommendedBudgets)}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-slate-900/80 p-2 rounded-xl border border-slate-750">
                <span className="text-[9px] text-slate-400 block font-medium">
                  Folga Mensal / Economia
                </span>
                <span
                  className={`text-xs font-bold ${
                    overallAnalysis.isWithinMeans ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {overallAnalysis.isWithinMeans ? '+' : ''}
                  {formatCurrency(overallAnalysis.monthlyBufferOrDeficit)}
                </span>
              </div>
            </div>

            {/* Expanded Analysis Explanations */}
            {showAnalysisDetails && (
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-indigo-500/20 text-[10px] text-slate-300 space-y-1.5 animate-in fade-in">
                <p>
                  • <strong>Como funciona o algoritmo:</strong> O sistema analisa suas médias dos últimos meses, gastos máximos e a tendência de cada categoria (se está em alta, estável ou em queda).
                </p>
                <p>
                  • <strong>Dentro das suas posses:</strong> Para categorias essenciais (alimentação, moradia, transporte), uma margem de segurança de 10% é preservada. Para categorias supérfluas ou com tendência de alta, um teto disciplinador é sugerido para gerar poupança.
                </p>
                {overallAnalysis.potentialTotalSavings > 0 && (
                  <p className="text-emerald-300 font-semibold">
                    💡 Adotar os limites sugeridos pode gerar até {formatCurrency(overallAnalysis.potentialTotalSavings)}/mês de economia sem comprometer seus gastos essenciais.
                  </p>
                )}
              </div>
            )}

            {/* Quick action button to apply all */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                {overallAnalysis.recommendations.length} categorias analisadas
              </span>

              <button
                type="button"
                onClick={handleApplyAllRecommendations}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aplicar Todos os Tetos Sugeridos</span>
              </button>
            </div>
          </div>
        )}

        {/* Category List & Forms Body */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2.5 min-h-[220px]">
          {/* Add Category Form */}
          {isAdding ? (
            <form
              onSubmit={handleCreateCategory}
              className="bg-slate-800/90 border border-emerald-500/50 rounded-2xl p-3.5 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  Nova Categoria de {activeTab === 'expense' ? 'Gasto' : 'Renda'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ex: Pet / Animais, Streaming, Cursos..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              {activeTab === 'expense' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-purple-400" />
                    Limite Mensal Máximo (Teto em R$) - Opcional
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 500.00"
                    value={newCatBudgetLimit}
                    onChange={(e) => setNewCatBudgetLimit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Defina quanto deseja gastar no máximo por mês nesta categoria
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-slate-400" />
                  Cor de Identificação
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {PRESET_CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center ${
                        newCatColor === c
                          ? 'scale-110 ring-2 ring-white shadow-lg'
                          : 'opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {newCatColor === c && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Salvar Categoria
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={handleStartAdd}
              className="w-full py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Criar Nova Categoria de {activeTab === 'expense' ? 'Gasto' : 'Renda'}
            </button>
          )}

          {/* List of Categories */}
          <div className="space-y-2">
            {filteredCategories.map((cat) => {
              const isEditingThis = editingId === cat.id;
              const rec = recMap.get(cat.id);

              if (isEditingThis) {
                return (
                  <form
                    key={cat.id}
                    onSubmit={handleSaveEdit}
                    className="bg-slate-800 border border-indigo-500/60 rounded-xl p-3 space-y-2.5 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">
                        Editar Categoria
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Nome da Categoria
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    {activeTab === 'expense' && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-slate-400 flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-purple-400" />
                            Teto Mensal de Gastos (R$)
                          </label>
                          {rec && (
                            <button
                              type="button"
                              onClick={() => setEditBudgetLimit(String(rec.recommendedLimit))}
                              className="text-[10px] text-purple-300 hover:text-purple-200 flex items-center gap-1 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                              Usar sugerido ({formatCurrency(rec.recommendedLimit)})
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 400.00 (deixe em branco para sem teto)"
                          value={editBudgetLimit}
                          onChange={(e) => setEditBudgetLimit(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-400 font-mono"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Cor de Identificação
                      </label>
                      <div className="grid grid-cols-8 gap-1.5 pt-0.5">
                        {PRESET_CATEGORY_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditColor(c)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center ${
                              editColor === c
                                ? 'scale-110 ring-2 ring-white shadow'
                                : 'opacity-70 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c }}
                          >
                            {editColor === c && (
                              <Check className="w-3 h-3 text-white stroke-[3]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs text-slate-400"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        Atualizar
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-750 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {cat.name}
                        </p>
                        {cat.isDefault && (
                          <span className="text-[9px] font-medium text-slate-500">
                            Padrão do sistema
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-lg transition-colors"
                        title="Editar categoria e teto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Remover categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Budget & Spending Recommendation details (for expense categories) */}
                  {cat.type === 'expense' && rec && (
                    <div className="pt-1 border-t border-slate-750/70 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            Teto Atual:{' '}
                            <strong className="text-slate-200 font-mono">
                              {cat.budgetLimit != null && cat.budgetLimit > 0
                                ? formatCurrency(cat.budgetLimit)
                                : 'Sem teto'}
                            </strong>
                          </span>

                          <span className="text-[10px] text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.2 rounded-md font-mono flex items-center gap-1 font-semibold">
                            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                            Sugerido: {formatCurrency(rec.recommendedLimit)}
                          </span>
                        </div>

                        {/* Quick adopt button if not yet equal */}
                        {cat.budgetLimit !== rec.recommendedLimit && (
                          <button
                            type="button"
                            onClick={() => handleAdoptRecommendation(cat.id, rec.recommendedLimit)}
                            className="text-[10px] bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 px-2 py-0.5 rounded-lg border border-indigo-500/40 font-semibold transition-colors flex items-center gap-1"
                          >
                            <span>Adotar {formatCurrency(rec.recommendedLimit)}</span>
                          </button>
                        )}
                      </div>

                      {/* Spending Insights & Rationale */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span>Média histórica: {formatCurrency(rec.avgMonthlySpend)}/mês</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            Tendência:{' '}
                            {rec.trend === 'increasing' ? (
                              <span className="text-rose-400 font-semibold flex items-center">
                                <TrendingUp className="w-3 h-3 mr-0.5" />
                                Alta ({rec.trendPercent > 0 ? `+${rec.trendPercent}%` : ''})
                              </span>
                            ) : rec.trend === 'decreasing' ? (
                              <span className="text-emerald-400 font-semibold flex items-center">
                                <TrendingDown className="w-3 h-3 mr-0.5" />
                                Baixa ({rec.trendPercent}%)
                              </span>
                            ) : (
                              <span className="text-slate-300 font-semibold flex items-center">
                                <Minus className="w-3 h-3 mr-0.5" />
                                Estável
                              </span>
                            )}
                          </span>
                        </div>

                        {rec.potentialMonthlySavings > 0 && (
                          <span className="text-emerald-400 font-medium">
                            Economia: +{formatCurrency(rec.potentialMonthlySavings)}
                          </span>
                        )}
                      </div>

                      {/* Rationale description */}
                      <p className="text-[10px] text-slate-400/90 italic">
                        {rec.rationale}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between mt-2">
          <button
            type="button"
            id="reset-categories-defaults-btn"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-amber-400 transition-colors font-medium"
            title="Restaurar lista original de categorias padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Padrões
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow"
          >
            Concluir
          </button>
        </div>
      </div>

      {/* In-App Confirmation Modal: Delete Category */}
      {catToDelete && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Excluir Categoria
            </h3>
            <p className="text-xs text-slate-300">
              Deseja realmente excluir a categoria{' '}
              <strong className="text-white">"{catToDelete.name}"</strong>? Lançamentos existentes manterão este rótulo no extrato.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Reset Defaults */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              Restaurar Categorias Padrão
            </h3>
            <p className="text-xs text-slate-300">
              Isso restaurará a lista inicial com as categorias essenciais do sistema.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmResetDefaults}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
