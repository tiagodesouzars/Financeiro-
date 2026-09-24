import React, { useState } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  Check,
  Send,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { FixedBill, FinancialStats } from '../types';
import {
  formatCurrency,
  getCurrentMonthKey,
  formatMonthYearPT,
} from '../utils/formatters';
import { getBillsForMonth, MonthBillView } from '../utils/storage';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bills: FixedBill[];
  stats?: FinancialStats;
  onPayBill: (bill: FixedBill, targetMonth?: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  bills,
  onPayBill,
}) => {
  const [browserPermission, setBrowserPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentMonthKey = getCurrentMonthKey();
  const today = new Date();
  const currentDay = today.getDate();

  // Resolve bills for the REAL current month
  const currentMonthBills = getBillsForMonth(bills, currentMonthKey);
  const activePendingBills = currentMonthBills.filter(
    (b) => b.resolvedStatus === 'pending' && b.paymentRequired !== false
  );

  const overdueBills = activePendingBills.filter((b) => b.dueDay < currentDay);
  const dueTodayBills = activePendingBills.filter((b) => b.dueDay === currentDay);
  const dueSoonBills = activePendingBills.filter(
    (b) => b.dueDay > currentDay && b.dueDay <= currentDay + 7
  );
  const upcomingThisMonth = activePendingBills.filter(
    (b) => b.dueDay > currentDay + 7
  );

  // Future bills (starting next month or beyond)
  const futureMonthBills = bills.filter(
    (b) => b.startMonth && b.startMonth > currentMonthKey
  );

  const handleRequestPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermission(perm);
        if (perm === 'granted') {
          new Notification('🔔 Lembretes Ativados com Sucesso!', {
            body: 'Você será alertado com nome da fatura, valor e data de vencimento.',
            icon: '/favicon.ico',
          });
          setNotificationMsg('Notificações habilitadas no seu dispositivo.');
        }
      } catch (err) {
        console.error('Error requesting notification permission', err);
      }
    }
  };

  const handleSendTestPush = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const sample = overdueBills[0] || dueTodayBills[0] || dueSoonBills[0];
      const title = sample
        ? `⚠️ Alerta de Vencimento: ${sample.name}`
        : '🔔 Lembrete Financeiro Ativo';
      const body = sample
        ? `A fatura no valor de ${formatCurrency(sample.amount)} vence dia ${sample.dueDay}. Pague para evitar juros.`
        : 'Tudo em dia! Seus lembretes de faturas e boletos estão ativos.';

      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      setNotificationMsg(`Notificação enviada: "${title}"`);
    } else {
      handleRequestPermission();
    }
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleNotifySpecificBill = (bill: MonthBillView) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`⚠️ Atenção: ${bill.name}`, {
        body: `Valor: ${formatCurrency(bill.amount)} • Vencimento: Dia ${bill.dueDay} • Forma: ${bill.paymentMethod}`,
        icon: '/favicon.ico',
      });
      setNotificationMsg(`Lembrete disparado para "${bill.name}"!`);
      setTimeout(() => setNotificationMsg(null), 3000);
    } else {
      handleRequestPermission();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Central de Lembretes & Faturas
              </h2>
              <p className="text-[11px] text-slate-400">
                Data de referência: Hoje, {today.getDate()} de {formatMonthYearPT(currentMonthKey)}
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

        {/* Browser Push Permission Banner */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">
                Alertas no Dispositivo
              </span>
            </div>
            {browserPermission !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors"
              >
                Ativar Alertas
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendTestPush}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold rounded-md flex items-center gap-1"
                  title="Disparar aviso de teste no dispositivo"
                >
                  <Send className="w-3 h-3" />
                  Testar
                </button>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ativo
                </span>
              </div>
            )}
          </div>
          {notificationMsg && (
            <p className="text-[10px] text-emerald-400 font-medium">
              {notificationMsg}
            </p>
          )}
        </div>

        {/* List of Alerts */}
        <div className="space-y-4">
          {/* Overdue Alerts */}
          {overdueBills.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 px-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Vencidas / Atrasadas no Mês Atual ({overdueBills.length})</span>
              </div>
              {overdueBills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {bill.name}
                      </span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full font-semibold">
                        Atrasada {currentDay - bill.dueDay}d
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-rose-300 font-bold">
                        {formatCurrency(bill.amount)}
                      </span>
                      <span>• Venceu dia {bill.dueDay}</span>
                      <span>• {bill.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleNotifySpecificBill(bill)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                      title="Disparar lembrete"
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onPayBill(bill, currentMonthKey)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 active:scale-95 shadow"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Pagar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Due Today Alerts */}
          {dueTodayBills.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 px-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Vencem Hoje ({dueTodayBills.length})</span>
              </div>
              {dueTodayBills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {bill.name}
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-semibold">
                        Hoje!
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-amber-300 font-bold">
                        {formatCurrency(bill.amount)}
                      </span>
                      <span>• Dia {bill.dueDay}</span>
                      <span>• {bill.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleNotifySpecificBill(bill)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                      title="Disparar lembrete"
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onPayBill(bill, currentMonthKey)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 active:scale-95 shadow"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Pagar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Due in next 7 days */}
          {dueSoonBills.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 px-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Próximos 7 Dias ({dueSoonBills.length})</span>
              </div>
              {dueSoonBills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {bill.name}
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-medium">
                        Em {bill.dueDay - currentDay} dias
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-slate-200 font-bold">
                        {formatCurrency(bill.amount)}
                      </span>
                      <span>• Vence dia {bill.dueDay}</span>
                      <span>• {bill.paymentMethod}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onPayBill(bill, currentMonthKey)}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Pagar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* All clear or only future bills */}
          {overdueBills.length === 0 &&
            dueTodayBills.length === 0 &&
            dueSoonBills.length === 0 && (
              <div className="text-center py-6 px-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-200">
                  Nenhum pagamento urgente pendente hoje
                </h3>
                <p className="text-[11px] text-slate-400">
                  Todas as faturas do mês atual estão pagas ou vencem mais adiante.
                </p>
              </div>
            )}

          {/* Upcoming this month */}
          {upcomingThisMonth.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
                Outras Faturas Deste Mês (Dias {upcomingThisMonth.map((b) => b.dueDay).join(', ')})
              </span>
              <div className="space-y-1.5">
                {upcomingThisMonth.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-2.5 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300"
                  >
                    <span className="truncate">{bill.name}</span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(bill.amount)} (Dia {bill.dueDay})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Future Month Scheduled Bills */}
          {futureMonthBills.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block mb-1.5 px-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Programadas para Meses Seguintes ({futureMonthBills.length})
              </span>
              <div className="space-y-1.5">
                {futureMonthBills.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 bg-slate-800/30 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-400"
                  >
                    <div>
                      <span className="text-slate-300 font-medium block">{b.name}</span>
                      <span className="text-[10px] text-purple-300">
                        Início em {formatMonthYearPT(b.startMonth || '')} • Vence dia {b.dueDay}
                      </span>
                    </div>
                    <span className="font-bold text-slate-300">
                      {formatCurrency(b.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
