import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  Wallet,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import { getMonthNamePT, getCurrentMonthKey } from '../utils/formatters';

interface HeaderProps {
  selectedMonth: string; // YYYY-MM
  onMonthChange: (newMonth: string) => void;
  pendingBillsCount: number;
  overdueBillsCount: number;
  onOpenNotifications: () => void;
  onOpenSettings?: () => void;
  onOpenSalaryConfig?: () => void;
  onOpenAndroidApk?: () => void;
  // Legacy optional props retained for safe backwards compatibility
  onOpenCategories?: () => void;
  onOpenCards?: () => void;
  onOpenSecurity?: () => void;
  isBiometricEnabled?: boolean;
  isCloudSyncing?: boolean;
  isCloudConnected?: boolean;
  onSyncCloud?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  onMonthChange,
  pendingBillsCount,
  overdueBillsCount,
  onOpenNotifications,
  onOpenSettings,
  onOpenSalaryConfig,
  onOpenAndroidApk,
}) => {
  const handleOpenSettings = onOpenSettings || onOpenSalaryConfig || (() => {});
  const currentRealMonthKey = getCurrentMonthKey();
  const [realYearStr, realMonthStr] = currentRealMonthKey.split('-');
  const realMonthIndex = parseInt(realMonthStr, 10) - 1;

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;

  const isCurrentMonth = selectedMonth === currentRealMonthKey;
  const isFutureMonth = selectedMonth > currentRealMonthKey;

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonthIndex = monthIndex - 1;
    if (newMonthIndex < 0) {
      newMonthIndex = 11;
      newYear -= 1;
    }
    const newMonthStr = String(newMonthIndex + 1).padStart(2, '0');
    onMonthChange(`${newYear}-${newMonthStr}`);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonthIndex = monthIndex + 1;
    if (newMonthIndex > 11) {
      newMonthIndex = 0;
      newYear += 1;
    }
    const newMonthStr = String(newMonthIndex + 1).padStart(2, '0');
    onMonthChange(`${newYear}-${newMonthStr}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* App Title & Icon */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5 leading-tight">
              Finanças Pessoais
            </h1>
            <p className="text-xs text-slate-400 font-medium">Controle Diário & Metas</p>
          </div>
        </div>

        {/* Action Controls - Clean: Only Notifications & Settings Menu */}
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <button
            id="notifications-bell-btn"
            onClick={onOpenNotifications}
            aria-label="Lembretes de faturas"
            className="relative p-2.5 rounded-xl text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700 active:scale-95"
            title="Lembretes e Vencimentos"
          >
            <Bell className="w-5 h-5" />
            {(overdueBillsCount > 0 || pendingBillsCount > 0) && (
              <span
                className={`absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${
                  overdueBillsCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                }`}
              >
                {overdueBillsCount > 0 ? overdueBillsCount : pendingBillsCount}
              </span>
            )}
          </button>

          {/* Android APK & S25 FE Shortcut Button */}
          {onOpenAndroidApk && (
            <button
              onClick={onOpenAndroidApk}
              aria-label="App Android & Galaxy S25 FE"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 hover:border-emerald-500/60 transition-all active:scale-95 shadow-sm text-xs font-semibold"
              title="Instalar App no Android / Baixar APK"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">APK Android</span>
            </button>
          )}

          {/* Unified Settings Menu Button */}
          <button
            id="open-settings-header-btn"
            onClick={handleOpenSettings}
            aria-label="Abrir Configurações"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-slate-100 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all active:scale-95 text-xs font-semibold shadow-sm"
            title="Configurações (Salário, Metas, Categorias, Biometria, Nuvem e Dados)"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span className="hidden xs:inline">Configurações</span>
          </button>
        </div>
      </div>

      {/* Month Navigator Bar */}
      <div className="max-w-md mx-auto mt-2.5 flex items-center justify-between bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>
            {getMonthNamePT(monthIndex)} de {year}
          </span>
          {isCurrentMonth ? (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">
              Atual
            </span>
          ) : (
            <span className="text-[10px] bg-slate-700/80 text-slate-300 px-1.5 py-0.2 rounded-full font-medium">
              {isFutureMonth ? 'Previsão' : 'Histórico'}
            </span>
          )}
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Jump back to Current Month Banner if browsing another month */}
      {!isCurrentMonth && (
        <div className="max-w-md mx-auto mt-1.5 flex items-center justify-between bg-indigo-950/50 border border-indigo-500/30 rounded-lg px-2.5 py-1 text-xs text-indigo-200 animate-in fade-in duration-150">
          <span className="text-[11px] text-slate-300 truncate">
            {isFutureMonth
              ? 'Você está visualizando previsões futuras.'
              : 'Você está consultando meses anteriores.'}
          </span>
          <button
            onClick={() => onMonthChange(currentRealMonthKey)}
            className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-md shrink-0 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Mês Atual ({getMonthNamePT(realMonthIndex)})
          </button>
        </div>
      )}
    </header>
  );
};

