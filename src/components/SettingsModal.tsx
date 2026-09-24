import React, { useState } from 'react';
import {
  Settings,
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
  Trash2,
  AlertTriangle,
  Fingerprint,
  Download,
} from 'lucide-react';
import {
  UserFinancialProfile,
  AutoSavingsRule,
} from '../types';
import { User } from 'firebase/auth';
import {
  formatMonthYearPT,
  getCurrentMonthKey,
} from '../utils/formatters';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserFinancialProfile;
  selectedMonth?: string;
  onSaveProfile: (profile: UserFinancialProfile) => void;
  onOpenCategoriesManager: () => void;
  onOpenSecurityModal: () => void;
  cloudUser: User | null;
  isCloudSyncing?: boolean;
  lastSyncTime?: string | null;
  onLoginGoogle?: () => Promise<void>;
  onLogoutCloud?: () => Promise<void>;
  onClearAllData: () => void;
  onExportPdf?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  selectedMonth,
  onSaveProfile,
  onOpenCategoriesManager,
  onOpenSecurityModal,
  cloudUser,
  isCloudSyncing = false,
  lastSyncTime,
  onLoginGoogle,
  onLogoutCloud,
  onClearAllData,
  onExportPdf,
}) => {
  const activeMonthKey = selectedMonth || getCurrentMonthKey();

  // Salary & Rules state
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

  // Confirmation state for deleting all data
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'budget' | 'preferences'>('budget');

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

  const handleConfirmClearAll = () => {
    onClearAllData();
    setShowClearConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Configurações
              </h2>
              <p className="text-xs text-slate-400">
                Salário, metas, categorias, segurança e conta
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch inside settings */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 my-3">
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'budget'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Salário & Regra de Metas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'preferences'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Categorias, Segurança & Conta
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'budget' && (
            <form id="settings-budget-form" onSubmit={handleSubmit} className="space-y-4">
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
                          ? 'Quanto você tem disponível na conta agora neste mês? (R$)'
                          : 'Valor parcial que você recebeu neste mês (R$)'}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={monthOverrideAmount}
                          onChange={(e) => setMonthOverrideAmount(e.target.value)}
                          placeholder="Ex: 500.00"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-blue-300 font-bold text-sm focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Anotação (opcional):
                      </label>
                      <input
                        type="text"
                        value={monthOverrideNote}
                        onChange={(e) => setMonthOverrideNote(e.target.value)}
                        placeholder="Ex: Saldo em conta Itaú / Nubank"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payday and Extra Income */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia do Pagamento
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={salaryPayDay}
                      onChange={(e) => setSalaryPayDay(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Dia do mês (ex: 5)</p>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Renda Extra Mensal
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={additionalIncome}
                      onChange={(e) => setAdditionalIncome(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Freelances / Extras</p>
                </div>
              </div>

              {/* Savings Rules */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="w-4 h-4 text-indigo-400" />
                  <label className="text-xs font-bold text-slate-200">
                    Regra de Metas & Economia
                  </label>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      id: 'balanced_20' as AutoSavingsRule,
                      title: 'Equilibrada (50 / 30 / 20)',
                      desc: '50% Essenciais, 30% Lazer, 20% Metas e Investimentos',
                    },
                    {
                      id: 'aggressive_30' as AutoSavingsRule,
                      title: 'Acelerada (30% para Metas)',
                      desc: 'Foco total em construir patrimônio ou quitar dívidas',
                    },
                    {
                      id: 'relaxed_10' as AutoSavingsRule,
                      title: 'Suave (10% para Metas)',
                      desc: 'Começando a poupar sem aperto no orçamento',
                    },
                    {
                      id: 'custom' as AutoSavingsRule,
                      title: 'Personalizada',
                      desc: 'Defina você mesmo a porcentagem exata a poupar',
                    },
                  ].map((rule) => (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => setSavingsRule(rule.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        savingsRule === rule.id
                          ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200'
                          : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                          savingsRule === rule.id
                            ? 'border-indigo-400 bg-indigo-500 text-white'
                            : 'border-slate-600'
                        }`}
                      >
                        {savingsRule === rule.id && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{rule.title}</p>
                        <p className="text-[10px] text-slate-400">{rule.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {savingsRule === 'custom' && (
                  <div className="mt-2.5 flex items-center gap-2 pl-4">
                    <span className="text-xs text-slate-300">Porcentagem:</span>
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
                      Alertas no sino da barra superior
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

              {/* Save Button for Budget Form */}
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Salvar Orçamento & Salário
              </button>
            </form>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-4">
              {/* Categories Management Item */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200">
                        Gerenciar Categorias
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Crie e personalize categorias de despesas e receitas
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCategoriesManager();
                    }}
                    className="px-3 py-1.5 bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow transition-colors"
                  >
                    <span>Editar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Biometrics Item */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-slate-200">
                          Bloqueio Biométrico
                        </h3>
                        {profile.securityConfig?.enabled ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                            Ativado
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-400 font-medium">
                            Desativado
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Proteja o app com Face ID, digital ou PIN do celular
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSecurityModal();
                    }}
                    className="px-3 py-1.5 bg-teal-600/90 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow transition-colors"
                  >
                    <span>Configurar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cloud Account & Automatic Persistence (No questionamento) */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                      <Cloud className={`w-4 h-4 ${isCloudSyncing ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200">
                        Conta & Banco de Dados em Nuvem
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Sincronização 100% automática sem fricção
                      </p>
                    </div>
                  </div>

                  {cloudUser && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Conectado
                    </span>
                  )}
                </div>

                {cloudUser ? (
                  <div className="space-y-2.5 pt-1">
                    <div className="p-2.5 bg-slate-900/80 border border-slate-750 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {cloudUser.photoURL ? (
                          <img
                            src={cloudUser.photoURL}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full border border-emerald-500/40"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <UserCheck className="w-4 h-4" />
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
                          className="px-2 py-1 text-[11px] text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-700 hover:border-rose-500/40 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" />
                          Sair
                        </button>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[11px] text-emerald-300">
                          Salvamento 100% Automático Ativo
                        </p>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          Ao conectar seu e-mail, cada nova despesa, fatura, meta ou investimento é salvo imediatamente na nuvem sem questionamentos.
                        </p>
                        {lastSyncTime && (
                          <p className="text-[9px] text-slate-400 mt-1">
                            Última sincronização confirmada: {lastSyncTime}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-slate-300">
                      Conecte sua conta Google uma única vez. A partir daí, todos os seus dados serão salvos silenciosamente no banco em nuvem sem solicitar confirmação manual:
                    </p>
                    {onLoginGoogle && (
                      <button
                        type="button"
                        onClick={onLoginGoogle}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <LogIn className="w-4 h-4" />
                        Conectar com Conta Google
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* PDF Report Export */}
              {onExportPdf && (
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-200">
                          Exportar Relatório em PDF
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          Baixe o resumo mensal, contas, extrato e metas
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onExportPdf();
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition-colors active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar PDF</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone: Clear all registered data */}
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-400">
                  <Trash2 className="w-4 h-4" />
                  <h3 className="text-xs font-bold">Zona de Perigo: Apagar Todos os Dados</h3>
                </div>

                <p className="text-[11px] text-slate-300">
                  Limpa todas as despesas, faturas, metas, cartões e investimentos salvos, zerando seu aplicativo para recomeçar.
                </p>

                {!showClearConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full py-2 px-3 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Apagar todos os dados cadastrados
                  </button>
                ) : (
                  <div className="bg-slate-900/90 border border-rose-500/60 rounded-xl p-3 space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2 text-rose-300 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <div>
                        <p className="font-bold">Atenção: Ação irreversível!</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Tem certeza de que deseja apagar todos os registros financeiros?
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmClearAll}
                        className="flex-1 py-1.5 text-xs text-white bg-rose-600 hover:bg-rose-500 rounded-lg font-bold shadow"
                      >
                        Sim, Apagar Tudo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
