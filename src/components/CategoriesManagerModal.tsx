import React, { useState } from 'react';
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
} from 'lucide-react';
import { CustomCategory, TransactionType } from '../types';
import { PRESET_CATEGORY_COLORS } from '../utils/formatters';
import { resetDefaultCategories } from '../utils/storage';

interface CategoriesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CustomCategory[];
  onUpdateCategories: (categories: CustomCategory[]) => void;
  initialType?: TransactionType;
}

export const CategoriesManagerModal: React.FC<CategoriesManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategories,
  initialType = 'expense',
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>(initialType);

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_CATEGORY_COLORS[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editing category state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // Confirmation states
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setNewCatName('');
    setErrorMsg(null);
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

    const newCategory: CustomCategory = {
      id: `cat-${activeTab}-${Date.now()}`,
      name: trimmed,
      type: activeTab,
      color: newCatColor,
      isDefault: false,
      createdAt: Date.now(),
    };

    onUpdateCategories([...categories, newCategory]);
    setNewCatName('');
    setIsAdding(false);
    setErrorMsg(null);
  };

  const handleStartEdit = (cat: CustomCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setIsAdding(false);
    setErrorMsg(null);
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

    const updated = categories.map((c) =>
      c.id === editingId ? { ...c, name: trimmed, color: editColor } : c
    );
    onUpdateCategories(updated);
    setEditingId(null);
    setErrorMsg(null);
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
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Gerenciar Categorias
              </h2>
              <p className="text-[11px] text-slate-400">
                Crie, edite e personalize seus gastos e rendas
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

        {/* Error Feedback */}
        {errorMsg && (
          <div className="mt-2.5 p-2 bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs rounded-xl flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
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
          <div className="space-y-1.5">
            {filteredCategories.map((cat) => {
              const isEditingThis = editingId === cat.id;

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

                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-400"
                    />

                    <div className="grid grid-cols-8 gap-1.5 pt-1">
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
                  className="flex items-center justify-between p-2.5 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-750 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-200 truncate">
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
                      title="Editar categoria"
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
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Excluir Categoria</h4>
                <p className="text-xs text-slate-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-750">
              Tem certeza que deseja remover a categoria <strong className="text-white">"{catToDelete.name}"</strong>?
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-delete-category-btn"
                onClick={confirmDeleteCategory}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Reset Default Categories */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Restaurar Padrões</h4>
                <p className="text-xs text-slate-400">Categorias de gastos e rendas</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-750 leading-relaxed">
              Deseja restaurar as categorias padrão do sistema? Suas categorias personalizadas serão substituídas pelo conjunto inicial.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-reset-categories-btn"
                onClick={confirmResetDefaults}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-600/30 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
