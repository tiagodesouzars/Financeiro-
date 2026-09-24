import React, { useState } from 'react';
import {
  Sliders,
  X,
  Wallet,
  Calendar,
  Sparkles,
  Check,
  Bell,
  PiggyBank,
  Tag,
  ChevronRight,
  Shield,
  Cloud,
  RefreshCw,
  LogIn,
  LogOut,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserFinancialProfile, AutoSavingsRule, MonthSalaryConfig } from '../types';
import { formatMonthYearPT, getCurrentMonthKey } from '../utils/formatters';

interface SalaryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserFinancialProfile;
  selectedMonth?: string;
  onSaveProfile: (profile: UserFinancialProfile) => void;
  onReloadData: () => void;
  onOpenCategoriesManager?: () => void;
  onOpenSecurityModal?: () => void;
  onSyncCloud?: () => Promise<void> | void;
  isSyncingCloud?: boolean;
  cloudUser?: User | null;
  onLoginGoogle?: () => Promise<void>;
  onLogoutCloud?: () => Promise<void>;
}

export const SalaryConfigModal: React.FC<SalaryConfigModalProps> = ({
  isOpen,
  onClose,
  profile,
  selectedMonth,
  onSaveProfile,
  onReloadData,
  onOpenCategoriesManager,
  onOpenSecurityModal,
  onSyncCloud,
  isSyncingCloud = false,
  cloudUser = null,
  onLoginGoogle,
  onLogoutCloud,
}) => {
  const activeMonthKey = selectedMonth || getCurrentMonthKey();
  const [fixedSalary, setFixedSalary] = useState(String(profile.fixedSalary));
  const [salaryPayDay, setSalaryPayDay] = useState(String(profile.salaryPayDay));
  const [additionalIncome, setAdditionalIncome] = useState(
    String(profile.additionalMonthlyIncome || 0)
  );

  // Start month for full salary (e.g. October 2026)
  const [hasSalaryStartMonth, setHasSalaryStartMonth] = useState(
    Boolean(profile.salaryStartMonth)
  );
  const [salaryStartMonth, setSalaryStartMonth] = useState(
    profile.salaryStartMonth || '2026-10'
  );

  // Month-specific override (e.g. Setembro remaining account balance or partial salary)
  const currentMonthOverride = profile.monthlySalaryOverrides?.[activeMonthKey];
  const [monthOverrideEnabled, setMonthOverrideEnabled] = useState(
    Boolean(currentMonthOverride)
  );
  const [monthOverrideAmount, setMonthOverrideAmount] = useState(
    currentMonthOverride?.amount != null ? String(currentMonthOverride.amount) : ''
  );
  const [monthOverrideType, setMonthOverrideType] = useState<
    'account_balance' | 'partial_salary' | 'full'
  >(currentMonthOverride?.type || 'account_balance');
  const [monthOverrideNote, setMonthOverrideNote] = useState(
    currentMonthOverride?.note || ''
  );

  const [savingsRule, setSavingsRule] = useState<AutoSavingsRule>(
    profile.savingsRule || 'balanced_20'
  );
  const [customPercent, setCustomPercent] = useState(
    String(profile.customSavingsPercent || 20)
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile.notificationsEnabled ?? true
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const salaryVal = parseFloat(fixedSalary.replace(',', '.')) || 0;
    const payDayVal = parseInt(salaryPayDay, 10) || 5;
    const extraVal = parseFloat(additionalIncome.replace(',', '.')) || 0;
    const percentVal = parseInt(customPercent, 10) || 20;

    const updatedOverrides = { ...(profile.monthlySalaryOverrides || {}) };
    if (monthOverrideEnabled && monthOverrideAmount.trim()) {
      const overrideVal = parseFloat(monthOverrideAmount.replace(',', '.')) || 0;
      updatedOverrides[activeMonthKey] = {
        amount: overrideVal,
        type: monthOverrideType,
        note:
          monthOverrideNote.trim() ||
          (monthOverrideType === 'account_balance'
            ? `Saldo restante em conta (${formatMonthYearPT(activeMonthKey)})`
            : `Salário parcial (${formatMonthYearPT(activeMonthKey)})`),
      };
    } else {
      delete updatedOverrides[activeMonthKey];
    }

    const updated: UserFinancialProfile = {
      ...profile,
      fixedSalary: salaryVal,
      salaryPayDay: Math.min(31, Math.max(1, payDayVal)),
      salaryStartMonth: hasSalaryStartMonth && salaryStartMonth ? salaryStartMonth : undefined,
      monthlySalaryOverrides: updatedOverrides,
      additionalMonthlyIncome: extraVal,
      savingsRule,
      customSavingsPercent: Math.min(90, Math.max(5, percentVal)),
      notificationsEnabled,
    };

    onSaveProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Salário Fixo & Regra de Metas
              </h2>
              <p className="text-[11px] text-slate-400">
                Configurações do seu orçamento pessoal
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fixed Salary */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Salário Fixo Integral (Líquido)
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">Valor Cheio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={fixedSalary}
                onChange={(e) => setFixedSalary(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-extrabold text-base focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Salary Start Month Option */}
            <div className="mt-3 pt-2.5 border-t border-slate-700/60">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSalaryStartMonth}
                  onChange={(e) => setHasSalaryStartMonth(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-500 rounded"
                />
                <span className="text-xs text-slate-300 font-medium">
                  Receberei o salário cheio apenas a partir de um mês futuro (ex: Outubro)
                </span>
              </label>

              {hasSalaryStartMonth && (
                <div className="mt-2 pl-5">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Mês de Início do Salário Integral:
                  </span>
                  <input
                    type="month"
                    value={salaryStartMonth}
                    onChange={(e) => setSalaryStartMonth(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    O valor integral de R$ {fixedSalary || '0'} passará a contar automaticamente a partir de {formatMonthYearPT(salaryStartMonth)}.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Month-Specific Override (e.g. Setembro Current Account Balance / Partial Salary) */}
          <div className="bg-gradient-to-br from-slate-800/90 to-blue-950/40 p-3.5 rounded-xl border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">
                  Saldo Atual em Conta / Salário Parcial ({formatMonthYearPT(activeMonthKey)})
                </h3>
                <p className="text-[10px] text-slate-300">
                  Ideal para quando você está no final do mês e ainda não tem o salário cheio
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={monthOverrideEnabled}
                onChange={(e) => setMonthOverrideEnabled(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-500 rounded"
              />
              <span className="text-xs text-blue-200 font-semibold">
                Definir saldo ou valor específico para {formatMonthYearPT(activeMonthKey)}
              </span>
            </label>

            {monthOverrideEnabled && (
              <div className="mt-2.5 space-y-2.5 pl-5 border-l-2 border-blue-500/30">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMonthOverrideType('account_balance')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                      monthOverrideType === 'account_balance'
                        ? 'bg-blue-600/30 border-blue-400 text-blue-100 shadow'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    Saldo na Conta
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonthOverrideType('partial_salary')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                      monthOverrideType === 'partial_salary'
                        ? 'bg-blue-600/30 border-blue-400 text-blue-100 shadow'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    Salário Parcial
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {monthOverrideType === 'account_balance'
                      ? 'Quanto você tem disponível na conta agora em Setembro? (R$)'
                      : 'Valor parcial que você recebeu neste mês (R$)'}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 850,00"
                      value={monthOverrideAmount}
                      onChange={(e) => setMonthOverrideAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-blue-300 font-bold text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Nota explicativa (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Saldo restante de setembro na conta corrente"
                    value={monthOverrideNote}
                    onChange={(e) => setMonthOverrideNote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pay Day and Extra Income */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dia do Pagamento
              </label>
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={salaryPayDay}
                  onChange={(e) => setSalaryPayDay(e.target.value)}
                  className="w-full bg-transparent text-white text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Renda Extra Estimada (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={additionalIncome}
                onChange={(e) => setAdditionalIncome(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Automatic Savings Rule Engine */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Regra de Economia Automática Baseada no Orçamento Livre</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'conservative_10',
                  title: '10% do Livre',
                  desc: 'Conservador',
                },
                {
                  id: 'balanced_20',
                  title: '20% do Livre',
                  desc: 'Equilibrado (Recomendado)',
                },
                {
                  id: 'growth_30',
                  title: '30% do Livre',
                  desc: 'Acelerado',
                },
                {
                  id: 'custom',
                  title: 'Personalizado',
                  desc: `${customPercent}% do Livre`,
                },
              ].map((rule) => (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => setSavingsRule(rule.id as AutoSavingsRule)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    savingsRule === rule.id
                      ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold">{rule.title}</p>
                  <p className="text-[10px] text-slate-400">{rule.desc}</p>
                </button>
              ))}
            </div>

            {savingsRule === 'custom' && (
              <div className="mt-2 flex items-center gap-2 bg-slate-800/70 p-2 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-300 font-semibold">
                  Porcentagem desejada:
                </span>
                <input
                  type="number"
                  min="5"
                  max="90"
                  value={customPercent}
                  onChange={(e) => setCustomPercent(e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-indigo-300 text-center"
                />
                <span className="text-xs font-bold text-slate-400">%</span>
              </div>
            )}
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-800/70 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-bold text-slate-200">
                  Lembretes de Faturas & Vencimentos
                </p>
                <p className="text-[10px] text-slate-400">
                  Alertas em destaque na tela inicial
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Biometric Lock Settings Button */}
          {onOpenSecurityModal && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Segurança & Privacidade do Aparelho
              </span>
              <button
                type="button"
                id="open-biometric-security-btn"
                onClick={() => {
                  onClose();
                  onOpenSecurityModal();
                }}
                className="w-full p-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-emerald-500/40 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                      Bloqueio com Biometria
                      {profile.securityConfig?.enabled && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                          Ativado
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {profile.securityConfig?.enabled
                        ? 'Digital ou Face ID configurado para acesso exclusivo'
                        : 'Proteger acesso com a biometria/digital do seu celular'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          )}

          {/* Cloud Database Sync */}
          {onSyncCloud && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400">
                  Banco de Dados em Nuvem (Firebase)
                </span>
                {cloudUser && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Conectado
                  </span>
                )}
              </div>

              {cloudUser ? (
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-850/80 border border-slate-750/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {cloudUser.photoURL ? (
                        <img
                          src={cloudUser.photoURL}
                          alt="Avatar"
                          className="w-7 h-7 rounded-full border border-emerald-500/40"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {cloudUser.displayName || 'Usuário Google'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {cloudUser.email}
                        </p>
                      </div>
                    </div>
                    {onLogoutCloud && (
                      <button
                        type="button"
                        onClick={onLogoutCloud}
                        title="Desconectar conta"
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    id="sync-cloud-database-btn"
                    onClick={onSyncCloud}
                    disabled={isSyncingCloud}
                    className="w-full p-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-blue-500/40 rounded-xl flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Cloud className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-pulse' : ''}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                          Sincronizar no Banco em Nuvem
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Salva e atualiza suas transações e dados no Firestore
                        </p>
                      </div>
                    </div>
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white ${isSyncingCloud ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-850/80 border border-slate-750/80 rounded-xl">
                    <p className="text-xs text-slate-300 mb-2">
                      Conecte sua conta Google para salvar suas finanças e sincronizar entre seus aparelhos:
                    </p>
                    {onLoginGoogle ? (
                      <button
                        type="button"
                        id="login-google-cloud-btn"
                        onClick={onLoginGoogle}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <LogIn className="w-4 h-4" />
                        Conectar com Conta Google
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onSyncCloud}
                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Cloud className="w-4 h-4" />
                        Conectar e Salvar na Nuvem
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Categories Management */}
          {onOpenCategoriesManager && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Personalização de Categorias
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCategoriesManager();
                }}
                className="w-full p-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                      Gerenciar Categorias
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Crie, edite e remova categorias de gastos e rendas
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          )}

          {/* Informação de Salvamento Automático */}
          <div className="pt-2 border-t border-slate-800">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200">
                  Salvamento 100% Automático
                </p>
                <p className="text-[10px] text-slate-400">
                  Cada transação, meta e investimento é salvo instantaneamente.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow"
            >
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
