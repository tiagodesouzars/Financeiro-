import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { Transaction, CustomCategory, PaymentMethod, ExpenseCategory, IncomeCategory } from '../types';
import { parseOfxContent, OfxTransaction } from '../utils/ofxParser';
import { formatCurrency, formatDateBR, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/formatters';

interface OfxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTransactions: (transactions: Transaction[]) => void;
  existingTransactions: Transaction[];
  customCategories?: CustomCategory[];
}

export const OfxImportModal: React.FC<OfxImportModalProps> = ({
  isOpen,
  onClose,
  onImportTransactions,
  existingTransactions,
  customCategories = [],
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<OfxTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.ofx')) {
      setErrorMsg('Por favor selecione um arquivo no formato .OFX válido.');
      return;
    }

    setFile(selected);
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const text = await selected.text();
      const parsed = parseOfxContent(text);

      if (parsed.length === 0) {
        setErrorMsg('Nenhuma movimentação financeira encontrada no arquivo OFX.');
        setParsedItems([]);
      } else {
        // Flag duplicates
        const enriched = parsed.map((item) => {
          const isDup = existingTransactions.some(
            (ex) =>
              ex.date === item.date &&
              Math.abs(ex.amount - item.amount) < 0.01 &&
              (ex.description.toLowerCase().includes(item.description.toLowerCase().slice(0, 8)) ||
                item.description.toLowerCase().includes(ex.description.toLowerCase().slice(0, 8)))
          );
          return {
            ...item,
            isDuplicate: isDup,
            selected: !isDup, // uncheck potential duplicates by default
          };
        });
        setParsedItems(enriched);
      }
    } catch {
      setErrorMsg('Falha ao processar o arquivo OFX.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectAll = (select: boolean) => {
    setParsedItems((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  const toggleItem = (fitId: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.fitId === fitId ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateItemCategory = (fitId: string, category: string) => {
    setParsedItems((prev) =>
      prev.map((item) =>
        item.fitId === fitId
          ? { ...item, suggestedCategory: category as ExpenseCategory | IncomeCategory }
          : item
      )
    );
  };

  const updateItemMethod = (fitId: string, method: PaymentMethod) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.fitId === fitId ? { ...item, suggestedPaymentMethod: method } : item))
    );
  };

  const handleConfirmImport = () => {
    const selectedItems = parsedItems.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      setErrorMsg('Selecione pelo menos um lançamento para importar.');
      return;
    }

    const newTxs: Transaction[] = selectedItems.map((item) => ({
      id: `tx-ofx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: item.type,
      amount: item.amount,
      category: item.suggestedCategory,
      description: item.description,
      date: item.date,
      paymentMethod: item.suggestedPaymentMethod,
      createdAt: Date.now(),
    }));

    onImportTransactions(newTxs);
    onClose();
  };

  const selectedCount = parsedItems.filter((i) => i.selected).length;
  const duplicateCount = parsedItems.filter((i) => i.isDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Importação & Conciliação OFX</h2>
              <p className="text-xs text-slate-400">Importe extratos de qualquer banco nacional</p>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Area */}
          {parsedItems.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-teal-500/50 rounded-3xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-800/20 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ofx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto text-teal-400 group-hover:scale-105 transition-transform mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Toque para selecionar o arquivo .OFX
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-2">
                Exporte o extrato OFX no aplicativo do seu banco (Nubank, Itaú, Bradesco, Inter, Santander, BB, C6, etc.)
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] text-teal-300 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Categorização e conciliação inteligente
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Stats Bar */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-300">
                    <strong className="text-white">{selectedCount}</strong> de{' '}
                    <strong className="text-white">{parsedItems.length}</strong> selecionados
                  </span>
                  {duplicateCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px]">
                      {duplicateCount} possível(is) duplicidade(s)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(true)}
                    className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-[11px] font-medium"
                  >
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(false)}
                    className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 text-[11px]"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                {parsedItems.map((item) => {
                  const isExpense = item.type === 'expense';
                  return (
                    <div
                      key={item.fitId}
                      className={`p-3 rounded-2xl border transition-all ${
                        item.selected
                          ? 'bg-slate-800/40 border-slate-700'
                          : 'bg-slate-900/30 border-slate-800/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleItem(item.fitId)}
                          className="text-slate-400 hover:text-teal-400 p-0.5"
                        >
                          {item.selected ? (
                            <CheckSquare className="w-4 h-4 text-teal-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-white truncate">
                              {item.description}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                isExpense ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {isExpense ? '-' : '+'}
                              {formatCurrency(item.amount)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-[10px] text-slate-400">
                              {formatDateBR(item.date)}
                            </span>

                            {/* Category Select */}
                            <select
                              value={item.suggestedCategory}
                              onChange={(e) => updateItemCategory(item.fitId, e.target.value)}
                              className="text-[11px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-slate-200 focus:outline-none focus:border-teal-500"
                            >
                              {(isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                              {customCategories
                                .filter((c) => c.type === item.type)
                                .map((c) => (
                                  <option key={c.id} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                            </select>

                            {/* Payment Method Select */}
                            <select
                              value={item.suggestedPaymentMethod}
                              onChange={(e) =>
                                updateItemMethod(item.fitId, e.target.value as PaymentMethod)
                              }
                              className="text-[11px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-slate-200 focus:outline-none focus:border-teal-500"
                            >
                              <option value="Cartão de Débito">Cartão de Débito</option>
                              <option value="Cartão de Crédito">Cartão de Crédito</option>
                              <option value="Transferência / Pix">Transferência / Pix</option>
                              <option value="Boleto">Boleto</option>
                              <option value="Dinheiro">Dinheiro</option>
                            </select>

                            {item.isDuplicate && (
                              <span className="text-[10px] text-amber-400 font-medium ml-auto">
                                Já existe registro similar
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/80">
          {parsedItems.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setParsedItems([]);
                  setFile(null);
                }}
                className="px-4 py-2 rounded-2xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Trocar Arquivo
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={selectedCount === 0}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar {selectedCount} Lançamento(s)</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-5 py-2 rounded-2xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
