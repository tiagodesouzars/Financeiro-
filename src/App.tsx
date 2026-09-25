import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  PieChart,
  Target,
  CreditCard,
  Plus,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  Tag,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Transaction,
  FixedBill,
  SavingsGoal,
  UserFinancialProfile,
  TransactionType,
  CustomCategory,
  InvestmentAsset,
  PaymentMethod,
  PaymentCard,
} from './types';
import {
  loadUserProfile,
  saveUserProfile,
  loadTransactions,
  saveTransactions,
  loadFixedBills,
  saveFixedBills,
  loadSavingsGoals,
  saveSavingsGoals,
  loadCustomCategories,
  saveCustomCategories,
  loadInvestments,
  saveInvestments,
  loadPaymentCards,
  savePaymentCards,
  calculateFinancialStats,
  calculateInvestmentStats,
  clearAllFinancialData,
  purgeAllLocalUnrealData,
} from './utils/storage';
import { getCurrentMonthKey, getTodayDateString, formatCurrency, triggerHaptic } from './utils/formatters';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { PendingBillsBanner } from './components/PendingBillsBanner';
import { ChartsSection } from './components/ChartsSection';
import { BudgetVsActualChart } from './components/BudgetVsActualChart';
import { DailyTipCard } from './components/DailyTipCard';
import { SavingsGoalsSection } from './components/SavingsGoalsSection';
import { BillsManager } from './components/BillsManager';
import { TransactionList } from './components/TransactionList';
import { QuickAddModal } from './components/QuickAddModal';
import { DailyViewModal } from './components/DailyViewModal';
import { InvestmentsSection } from './components/InvestmentsSection';
import { BiometricLockScreen } from './components/BiometricLockScreen';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { CreditAndCommitmentsCard } from './components/CreditAndCommitmentsCard';

// Code-splitting heavy modals and projection components with React.lazy
const SettingsModal = React.lazy(() =>
  import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);
const SalaryConfigModal = React.lazy(() =>
  import('./components/SalaryConfigModal').then((m) => ({ default: m.SalaryConfigModal }))
);
const NotificationsModal = React.lazy(() =>
  import('./components/NotificationsModal').then((m) => ({ default: m.NotificationsModal }))
);
const CategoriesManagerModal = React.lazy(() =>
  import('./components/CategoriesManagerModal').then((m) => ({ default: m.CategoriesManagerModal }))
);
const InvestmentModal = React.lazy(() =>
  import('./components/InvestmentModal').then((m) => ({ default: m.InvestmentModal }))
);
const SecurityConfigModal = React.lazy(() =>
  import('./components/SecurityConfigModal').then((m) => ({ default: m.SecurityConfigModal }))
);
const CloudSyncModal = React.lazy(() =>
  import('./components/CloudSyncModal').then((m) => ({ default: m.CloudSyncModal }))
);
const MonthlyBalanceModal = React.lazy(() =>
  import('./components/MonthlyBalanceModal').then((m) => ({ default: m.MonthlyBalanceModal }))
);
const CardsManagerModal = React.lazy(() =>
  import('./components/CardsManagerModal').then((m) => ({ default: m.CardsManagerModal }))
);
const CashFlowProjection = React.lazy(() =>
  import('./components/CashFlowProjection').then((m) => ({ default: m.CashFlowProjection }))
);
const FireSimulatorModal = React.lazy(() =>
  import('./components/FireSimulatorModal').then((m) => ({ default: m.FireSimulatorModal }))
);
const InvestmentRebalanceModal = React.lazy(() =>
  import('./components/InvestmentRebalanceModal').then((m) => ({ default: m.InvestmentRebalanceModal }))
);
const OfxImportModal = React.lazy(() =>
  import('./components/OfxImportModal').then((m) => ({ default: m.OfxImportModal }))
);
import { exportMonthlyReportPdf } from './utils/pdfExport';
import { exportTransactionsToCsv } from './utils/csvExport';
import {
  backupFullDataToCloud,
  fetchFullDataFromCloud,
  purgeUnrealDataFromCloud,
  clearAllCloudFinancialData,
  saveTransactionToCloud,
  deleteTransactionFromCloud,
  saveFixedBillToCloud,
  deleteFixedBillFromCloud,
  saveSavingsGoalToCloud,
  deleteSavingsGoalFromCloud,
  saveInvestmentToCloud,
  deleteInvestmentFromCloud,
  savePaymentCardToCloud,
  deletePaymentCardFromCloud,
  initFirebaseAuth,
  subscribeToAuthChanges,
  loginWithGoogle,
  logoutFirebase,
} from './services/cloudStorage';
import { User } from 'firebase/auth';
import { BiometricSecurityConfig } from './types';
import { initOfflineSyncListener } from './services/offlineSync';

type ActiveNavTab = 'dashboard' | 'transactions' | 'investments' | 'goals' | 'bills';

export default function App() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');

  // Core state
  const [profile, setProfile] = useState<UserFinancialProfile>(loadUserProfile);
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [bills, setBills] = useState<FixedBill[]>(loadFixedBills);
  const [goals, setGoals] = useState<SavingsGoal[]>(loadSavingsGoals);
  const [categories, setCategories] = useState<CustomCategory[]>(loadCustomCategories);
  const [investments, setInvestments] = useState<InvestmentAsset[]>(loadInvestments);
  const [cards, setCards] = useState<PaymentCard[]>(loadPaymentCards);

  // Biometric Lock Screen State
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const p = loadUserProfile();
    return !!p.securityConfig?.enabled;
  });
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const isInitialLoadRef = useRef(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<TransactionType>('expense');
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [dailyViewOpen, setDailyViewOpen] = useState(false);
  const [salaryConfigOpen, setSalaryConfigOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [categoriesManagerOpen, setCategoriesManagerOpen] = useState(false);
  const [cardsManagerOpen, setCardsManagerOpen] = useState(false);
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<InvestmentAsset | null>(null);
  const [monthlyBalanceOpen, setMonthlyBalanceOpen] = useState(false);
  const [rebalanceModalOpen, setRebalanceModalOpen] = useState(false);
  const [fireSimulatorOpen, setFireSimulatorOpen] = useState(false);
  const [ofxModalOpen, setOfxModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto sync with cloud on start, auth listener & handle app focus for biometrics
  useEffect(() => {
    // 1. Purge any local unreal items immediately
    purgeAllLocalUnrealData();

    // 2. Listen to Firebase Auth state
    const unsubscribeAuth = subscribeToAuthChanges(async (user) => {
      setCloudUser(user);
      if (user) {
        try {
          setIsCloudSyncing(true);
          // Purge any unreal docs directly from cloud
          await purgeUnrealDataFromCloud();

          // Fetch fresh cloud data
          const cloudRes = await fetchFullDataFromCloud();
          if (cloudRes.success && cloudRes.data) {
            if (cloudRes.data.profile) {
              setProfile((prev) => ({ ...prev, ...cloudRes.data!.profile }));
            }
            if (cloudRes.data.transactions.length > 0) {
              setTransactions(cloudRes.data.transactions);
            }
            if (cloudRes.data.bills.length > 0) {
              setBills(cloudRes.data.bills);
            }
            if (cloudRes.data.goals.length > 0) {
              setGoals(cloudRes.data.goals);
            }
            if (cloudRes.data.categories.length > 0) {
              setCategories(cloudRes.data.categories);
            }
            if (cloudRes.data.investments.length > 0) {
              setInvestments(cloudRes.data.investments);
            }
            if (cloudRes.data.cards && cloudRes.data.cards.length > 0) {
              setCards(cloudRes.data.cards);
            }
            const now = new Date();
            setLastSyncTime(
              now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            );
          }
        } catch (e) {
          console.error('Initial cloud sync error:', e);
        } finally {
          setIsCloudSyncing(false);
          isInitialLoadRef.current = false;
        }
      } else {
        isInitialLoadRef.current = false;
      }
    });

    // 3. Listen for online reconnection to drain Dexie offline queue
    const unsubscribeOffline = initOfflineSyncListener((count) => {
      showToast(`${count} alterações offline foram sincronizadas com a nuvem!`);
    });

    // 4. Send local notification alert via Service Worker for bills due today
    if ('serviceWorker' in navigator && bills.length > 0) {
      const today = new Date();
      const currentDay = today.getDate();
      const curMonth = getCurrentMonthKey();
      const dueToday = bills.filter(
        (b) => b.dueDay === currentDay && (!b.paidMonths || !b.paidMonths.includes(curMonth))
      );
      if (dueToday.length > 0 && navigator.serviceWorker.controller) {
        dueToday.forEach((bill) => {
          navigator.serviceWorker.controller?.postMessage({
            type: 'SHOW_BILL_ALERT',
            title: 'Lembrete de Vencimento',
            body: `A conta "${bill.name}" (${formatCurrency(bill.amount)}) vence hoje!`,
            billId: bill.id,
          });
        });
      }
    }

    // Visibility change listener: lock app when minimized if biometric lock is active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currProfile = loadUserProfile();
        if (currProfile.securityConfig?.enabled && currProfile.securityConfig.requireOnAppResume) {
          setIsLocked(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      unsubscribeAuth();
      unsubscribeOffline();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleLoginGoogle = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        showToast(`Conectado como ${user.displayName || user.email || 'Usuário'}`);
        // Immediately sync local data up to cloud
        await handleSyncToCloud();
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code !== 'auth/popup-closed-by-user') {
        showToast('Não foi possível conectar com o Google.');
      }
    }
  };

  const handleLogoutCloud = async () => {
    try {
      await logoutFirebase();
      setCloudUser(null);
      showToast('Desconectado do banco de dados em nuvem.');
    } catch {
      showToast('Erro ao desconectar.');
    }
  };

  // Sync current data to Firebase Firestore
  const handleSyncToCloud = async () => {
    if (!cloudUser) {
      // Prompt user to connect with Google
      try {
        const user = await loginWithGoogle();
        if (!user) return;
        showToast(`Conectado como ${user.displayName || user.email}`);
      } catch (err: unknown) {
        const e = err as { code?: string };
        if (e?.code !== 'auth/popup-closed-by-user') {
          showToast('Conexão com Google necessária para salvar na nuvem.');
        }
        return;
      }
    }

    setIsCloudSyncing(true);
    try {
      const res = await backupFullDataToCloud({
        profile,
        transactions,
        bills,
        goals,
        categories,
        investments,
        cards,
      });
      if (res.success) {
        const now = new Date();
        setLastSyncTime(
          now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
        showToast('Dados salvos no seu banco de dados em nuvem com sucesso!');
      } else {
        showToast(res.error || 'Erro ao salvar no banco em nuvem.');
        throw new Error(res.error || 'Erro ao salvar no banco em nuvem.');
      }
    } catch (err: any) {
      showToast('Falha na comunicação com o banco.');
      throw err;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Restore saved data from Firebase Firestore
  const handleRestoreFromCloud = async () => {
    if (!cloudUser) {
      const user = await loginWithGoogle();
      if (!user) return;
    }

    setIsCloudSyncing(true);
    try {
      const res = await fetchFullDataFromCloud();
      if (res.success && res.data) {
        if (res.data.profile) {
          setProfile(res.data.profile);
          saveUserProfile(res.data.profile);
        }
        const loadedTxs = res.data.transactions || [];
        setTransactions(loadedTxs);
        saveTransactions(loadedTxs);

        const loadedBills = res.data.bills || [];
        setBills(loadedBills);
        saveFixedBills(loadedBills);

        const loadedGoals = res.data.goals || [];
        setGoals(loadedGoals);
        saveSavingsGoals(loadedGoals);

        if (res.data.categories && res.data.categories.length > 0) {
          setCategories(res.data.categories);
          saveCustomCategories(res.data.categories);
        }

        const loadedInvestments = res.data.investments || [];
        setInvestments(loadedInvestments);
        saveInvestments(loadedInvestments);

        const loadedCards = res.data.cards || [];
        setCards(loadedCards);
        savePaymentCards(loadedCards);

        const now = new Date();
        setLastSyncTime(
          now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
        showToast('Dados restaurados da nuvem com sucesso!');
      } else {
        throw new Error(res.error || 'Nenhum dado encontrado na nuvem para restaurar.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao recuperar dados da nuvem.');
      throw err;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Reset / Zero out all data (clean slate both locally and in cloud)
  const handleClearAllData = async () => {
    clearAllFinancialData();
    if (cloudUser) {
      setIsCloudSyncing(true);
      try {
        await clearAllCloudFinancialData();
      } catch (e) {
        console.error('Error clearing cloud data:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
    setTransactions([]);
    setBills([]);
    setGoals([]);
    setInvestments([]);
    setCards([]);
    savePaymentCards([]);
    const freshProfile = loadUserProfile();
    setProfile(freshProfile);
    showToast('Todos os registros foram zerados com sucesso!');
  };

  // Purge any unreal or demo items locally and in cloud
  const handlePurgeUnrealData = async () => {
    purgeAllLocalUnrealData();
    if (cloudUser) {
      setIsCloudSyncing(true);
      try {
        await purgeUnrealDataFromCloud();
      } catch (e) {
        console.error('Error purging unreal data from cloud:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
    handleReloadData();
    showToast('Todos os dados fictícios ou de teste foram apagados com sucesso!');
  };

  const handleSaveSecurityConfig = (cfg: BiometricSecurityConfig) => {
    const updated: UserFinancialProfile = {
      ...profile,
      securityConfig: cfg,
    };
    setProfile(updated);
    saveUserProfile(updated);
    if (cfg.enabled) {
      showToast('Proteção por biometria configurada com sucesso!');
    } else {
      setIsLocked(false);
      showToast('Proteção biométrica desativada.');
    }
  };

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveFixedBills(bills);
  }, [bills]);

  useEffect(() => {
    saveSavingsGoals(goals);
  }, [goals]);

  useEffect(() => {
    saveCustomCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveInvestments(investments);
  }, [investments]);

  useEffect(() => {
    savePaymentCards(cards);
  }, [cards]);

  // 100% Automatic Background Cloud Sync on state changes
  useEffect(() => {
    if (isInitialLoadRef.current) return;
    if (!cloudUser) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    setIsCloudSyncing(true);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await backupFullDataToCloud({
          profile,
          transactions,
          bills,
          goals,
          categories,
          investments,
          cards,
        });
        if (res.success) {
          const now = new Date();
          setLastSyncTime(
            now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          );
        }
      } catch (e) {
        console.error('Auto cloud sync failed:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }, 1200);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [profile, transactions, bills, goals, categories, investments, cards, cloudUser]);

  // Calculate stats for the selected month
  const stats = calculateFinancialStats(selectedMonth, transactions, bills, profile);
  const investmentStats = calculateInvestmentStats(investments, selectedMonth);

  // Real month stats anchored to actual current month (for notification bell & badge)
  const currentRealMonthKey = getCurrentMonthKey();
  const realMonthStats = calculateFinancialStats(currentRealMonthKey, transactions, bills, profile);

  // Handlers
  const handleReloadData = () => {
    setProfile(loadUserProfile());
    setTransactions(loadTransactions());
    setBills(loadFixedBills());
    setGoals(loadSavingsGoals());
    setCategories(loadCustomCategories());
    setInvestments(loadInvestments());
    setCards(loadPaymentCards());
  };

  const handleSaveCard = (card: PaymentCard) => {
    const exists = cards.some((c) => c.id === card.id);
    let updatedCards: PaymentCard[];
    if (exists) {
      updatedCards = cards.map((c) => (c.id === card.id ? card : c));
    } else {
      updatedCards = [...cards, card];
    }
    setCards(updatedCards);
    savePaymentCards(updatedCards);
    savePaymentCardToCloud(card).catch(() => {});
    showToast(`Cartão "${card.name}" salvo com sucesso!`);
  };

  const handleDeleteCard = (cardId: string) => {
    const updatedCards = cards.filter((c) => c.id !== cardId);
    setCards(updatedCards);
    savePaymentCards(updatedCards);
    deletePaymentCardFromCloud(cardId).catch(() => {});
    showToast('Cartão removido.');
  };

  const handleOpenQuickAdd = (type: TransactionType = 'expense') => {
    setTransactionToEdit(null);
    setQuickAddType(type);
    setQuickAddOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setQuickAddType(tx.type);
    setQuickAddOpen(true);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
    saveTransactionToCloud(updatedTx).catch(() => {});
    triggerHaptic(15);
    showToast('Lançamento atualizado com sucesso!');
  };

  const handleExportCsv = () => {
    try {
      exportTransactionsToCsv(transactions, selectedMonth);
      triggerHaptic(20);
      showToast('Planilha CSV gerada e baixada!');
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
      showToast('Erro ao exportar arquivo CSV.');
    }
  };

  const handleAddTransaction = (
    newTx: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    const item: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
      createdAt: Date.now(),
    };

    setTransactions((prev) => [item, ...prev]);
    saveTransactionToCloud(item).catch(() => {});
    triggerHaptic(15);
    showToast(
      `${item.type === 'expense' ? 'Gasto' : 'Renda'} de ${formatCurrency(item.amount)} registrado!`
    );
  };

  const handleAddMultipleTransactions = (
    newTxs: Omit<Transaction, 'id' | 'createdAt'>[],
    optionalBill?: FixedBill
  ) => {
    const items: Transaction[] = newTxs.map((tx, idx) => ({
      ...tx,
      id: `tx-${Date.now()}-${idx}`,
      createdAt: Date.now() + idx,
    }));

    setTransactions((prev) => [...items, ...prev]);
    items.forEach((item) => saveTransactionToCloud(item).catch(() => {}));

    if (optionalBill) {
      setBills((prev) => [...prev, optionalBill]);
      saveFixedBillToCloud(optionalBill).catch(() => {});
    }

    showToast(
      items.length > 1
        ? `${items.length} parcelas registradas para os respectivos meses!`
        : 'Lançamento registrado!'
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    deleteTransactionFromCloud(id).catch(() => {});
    showToast('Lançamento removido.');
  };

  const handlePayBill = (bill: FixedBill, targetMonth?: string) => {
    const monthToPay = targetMonth || selectedMonth;
    const existingPaidMonths = bill.paidMonths || [];
    const updatedPaidMonths = existingPaidMonths.includes(monthToPay)
      ? existingPaidMonths
      : [...existingPaidMonths, monthToPay];

    // 1. Update bill status to paid for target month
    const updatedBill: FixedBill = {
      ...bill,
      status: 'paid' as const,
      paidDate: getTodayDateString(),
      lastPaidMonth: monthToPay,
      paidMonths: updatedPaidMonths,
    };
    const updatedBills = bills.map((b) =>
      b.id === bill.id ? updatedBill : b
    );
    setBills(updatedBills);
    saveFixedBillToCloud(updatedBill).catch(() => {});

    // 2. Automatically register this bill payment as an expense transaction for consistency if not exists
    const alreadyRegistered = transactions.some(
      (t) => t.linkedBillId === bill.id && t.date.startsWith(monthToPay)
    );

    if (!alreadyRegistered) {
      const autoExpense: Transaction = {
        id: `tx-bill-${Date.now()}`,
        type: 'expense',
        amount: bill.amount,
        category: bill.category,
        description: `Pagamento: ${bill.name}`,
        date: getTodayDateString(),
        paymentMethod: bill.paymentMethod,
        linkedBillId: bill.id,
        createdAt: Date.now(),
      };

      setTransactions((prev) => [autoExpense, ...prev]);
      saveTransactionToCloud(autoExpense).catch(() => {});
    }
    showToast(`Fatura "${bill.name}" marcada como paga e debitada no mês!`);
  };

  const handleDepositGoal = (goalId: string, amount: number) => {
    const targetGoal = goals.find((g) => g.id === goalId);
    if (!targetGoal) return;

    const updatedGoal: SavingsGoal = {
      ...targetGoal,
      currentAmount: Math.min(targetGoal.targetAmount, targetGoal.currentAmount + amount),
    };

    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? updatedGoal : g))
    );
    saveSavingsGoalToCloud(updatedGoal).catch(() => {});

    // Also register an expense transaction under 'Investimentos' or Goal savings
    const goalTx: Transaction = {
      id: `tx-goal-${Date.now()}`,
      type: 'expense',
      amount: amount,
      category: 'Investimentos',
      description: `Aporte Meta: ${targetGoal.title}`,
      date: getTodayDateString(),
      paymentMethod: 'Pix',
      createdAt: Date.now(),
    };
    setTransactions((prev) => [goalTx, ...prev]);
    saveTransactionToCloud(goalTx).catch(() => {});
    showToast(`Aporte de ${formatCurrency(amount)} guardado em "${targetGoal.title}"!`);
  };

  const handleSaveInvestment = (
    asset: InvestmentAsset,
    debitFromMonthlyBudget: boolean,
    paymentMethod: PaymentMethod
  ) => {
    const exists = investments.some((i) => i.id === asset.id);
    let updatedInvestments: InvestmentAsset[];

    if (exists) {
      updatedInvestments = investments.map((i) => (i.id === asset.id ? asset : i));
    } else {
      updatedInvestments = [asset, ...investments];
    }
    setInvestments(updatedInvestments);
    saveInvestmentToCloud(asset).catch(() => {});

    // If money was transformed into investment from current month budget
    if (debitFromMonthlyBudget && !exists) {
      const investmentTx: Transaction = {
        id: `tx-inv-${Date.now()}`,
        type: 'expense',
        amount: asset.totalInvested,
        category: 'Investimentos',
        description: `Investimento: ${asset.name} (${asset.category})`,
        date: asset.purchaseDate || getTodayDateString(),
        paymentMethod,
        linkedInvestmentId: asset.id,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [investmentTx, ...prev]);
      saveTransactionToCloud(investmentTx).catch(() => {});
      showToast(
        `${formatCurrency(asset.totalInvested)} transformados em investimento em "${asset.name}"!`
      );
    } else {
      showToast(`Investimento "${asset.name}" salvo com sucesso!`);
    }
  };

  const handleDeleteInvestment = (id: string) => {
    setInvestments((prev) => prev.filter((i) => i.id !== id));
    deleteInvestmentFromCloud(id).catch(() => {});
    showToast('Investimento removido da carteira.');
  };

  const handleEditInvestment = (asset: InvestmentAsset) => {
    setAssetToEdit(asset);
    setInvestmentModalOpen(true);
  };

  const handleExportPdf = () => {
    try {
      exportMonthlyReportPdf({
        selectedMonth,
        profile,
        stats,
        transactions,
        bills,
        goals,
        cards,
      });
      triggerHaptic(25);
      showToast('Relatório PDF baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      showToast('Erro ao exportar PDF. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Centered Mobile Frame Container (Ergonomic max-w-lg optimized for Galaxy S25 FE AMOLED Display) */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col relative pb-28 shadow-2xl bg-slate-900/95 min-h-screen border-x border-slate-800/80">
        {/* Sticky Header with month picker, notifications and settings menu */}
        <Header
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          pendingBillsCount={realMonthStats.pendingBillsCount}
          overdueBillsCount={realMonthStats.overdueBillsCount}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenSettings={() => setSalaryConfigOpen(true)}
          onOpenSalaryConfig={() => setSalaryConfigOpen(true)}
        />

        {/* In-app PWA install banner */}
        <PWAInstallPrompt />

        {/* Dynamic Toast Feedback */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Views Content */}
        <main className="p-4 space-y-4 flex-1">
          {activeTab === 'dashboard' && (
            <>
              {/* Primary Balance & Quick Actions */}
              <BalanceCard
                stats={stats}
                profile={profile}
                investmentStats={investmentStats}
                onOpenQuickAdd={handleOpenQuickAdd}
                onOpenDailyView={() => setDailyViewOpen(true)}
                onOpenBills={() => setActiveTab('bills')}
                onOpenInvestments={() => setActiveTab('investments')}
                onOpenMonthlyBalance={() => setMonthlyBalanceOpen(true)}
                onOpenSalaryConfig={() => setSalaryConfigOpen(true)}
                onExportPdf={handleExportPdf}
              />

              {/* Credit Cards & Future Commitments Overview */}
              <CreditAndCommitmentsCard
                cards={cards}
                transactions={transactions}
                bills={bills}
                selectedMonth={selectedMonth}
                stats={stats}
                onNavigateToMonth={setSelectedMonth}
                onOpenCardsManager={() => setCardsManagerOpen(true)}
                onOpenBills={() => setActiveTab('bills')}
              />

              {/* Dica do Dia baseada nos gastos locais do mês anterior */}
              <DailyTipCard
                transactions={transactions}
                bills={bills}
                profile={profile}
                stats={stats}
                selectedMonth={selectedMonth}
                onNavigateToTab={setActiveTab}
                onOpenSalaryConfig={() => setSalaryConfigOpen(true)}
              />

              {/* Pending Bills Alert Banner */}
              <PendingBillsBanner
                bills={bills}
                onOpenBills={() => setActiveTab('bills')}
                onPayBillQuick={handlePayBill}
              />

              {/* Orçamento Mensal vs. Gasto Real (Recharts) */}
              <BudgetVsActualChart
                stats={stats}
                profile={profile}
                transactions={transactions}
                selectedMonth={selectedMonth}
                customCategories={categories}
                onOpenSalaryConfig={() => setSalaryConfigOpen(true)}
                onOpenQuickAdd={() => handleOpenQuickAdd('expense')}
              />

              {/* Projeção do Fluxo de Caixa (6 a 12 meses) */}
              <React.Suspense
                fallback={
                  <div className="h-32 bg-slate-800/40 rounded-2xl animate-pulse flex items-center justify-center text-xs text-slate-500">
                    Carregando projeção de fluxo de caixa...
                  </div>
                }
              >
                <CashFlowProjection
                  currentMonth={selectedMonth}
                  transactions={transactions}
                  bills={bills}
                  cards={cards}
                  profile={profile}
                  goals={goals}
                />
              </React.Suspense>

              {/* Clear Visual Charts */}
              <ChartsSection
                transactions={transactions}
                selectedMonth={selectedMonth}
                customCategories={categories}
              />

              {/* Automatic Savings Preview */}
              <SavingsGoalsSection
                goals={goals}
                availableBudget={stats.availableBudget}
                projectedSavings={stats.projectedSavings}
                savingsRate={stats.savingsRate}
                onUpdateGoals={setGoals}
                onDepositGoal={handleDepositGoal}
              />

              {/* Recent Transactions Snippet */}
              <TransactionList
                transactions={transactions}
                selectedMonth={selectedMonth}
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={handleEditTransaction}
                customCategories={categories}
                onExportPdf={handleExportPdf}
                onExportCsv={handleExportCsv}
                onOpenOfxImport={() => setOfxModalOpen(true)}
              />
            </>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-100">
                    Extrato Completo
                  </h2>
                  <p className="text-xs text-slate-400">
                    Todas as movimentações diárias e mensais
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setOfxModalOpen(true)}
                    className="p-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 text-xs font-semibold rounded-xl border border-teal-500/30 flex items-center gap-1 transition-all active:scale-95"
                    title="Importar Extrato Bancário (.OFX)"
                  >
                    <Download className="w-3.5 h-3.5 rotate-180" />
                    <span className="hidden sm:inline">OFX</span>
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 flex items-center gap-1 transition-all active:scale-95"
                    title="Exportar Extrato em CSV (Excel / Planilhas)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 flex items-center gap-1 transition-all active:scale-95"
                    title="Exportar Relatório PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button
                    onClick={() => setCategoriesManagerOpen(true)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1"
                    title="Gerenciar Categorias"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Categorias</span>
                  </button>
                  <button
                    onClick={() => handleOpenQuickAdd('expense')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Novo
                  </button>
                </div>
              </div>

              <TransactionList
                transactions={transactions}
                selectedMonth={selectedMonth}
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={handleEditTransaction}
                customCategories={categories}
                onExportPdf={handleExportPdf}
                onExportCsv={handleExportCsv}
                onOpenOfxImport={() => setOfxModalOpen(true)}
                isFullPage={true}
              />
            </div>
          )}

          {activeTab === 'investments' && (
            <InvestmentsSection
              investments={investments}
              investmentStats={investmentStats}
              selectedMonth={selectedMonth}
              onOpenAddModal={() => {
                setAssetToEdit(null);
                setInvestmentModalOpen(true);
              }}
              onEditAsset={handleEditInvestment}
              onDeleteAsset={handleDeleteInvestment}
              onOpenRebalance={() => setRebalanceModalOpen(true)}
              onOpenFireSimulator={() => setFireSimulatorOpen(true)}
            />
          )}

          {activeTab === 'goals' && (
            <div className="space-y-4">
              <SavingsGoalsSection
                goals={goals}
                availableBudget={stats.availableBudget}
                projectedSavings={stats.projectedSavings}
                savingsRate={stats.savingsRate}
                onUpdateGoals={setGoals}
                onDepositGoal={handleDepositGoal}
              />
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="space-y-4">
              <BillsManager
                bills={bills}
                onUpdateBills={setBills}
                onPayBill={handlePayBill}
                customCategories={categories}
                selectedMonth={selectedMonth}
                cards={cards}
                onSaveCard={handleSaveCard}
                onDeleteCard={handleDeleteCard}
                transactions={transactions}
                onOpenCardsManager={() => setCardsManagerOpen(true)}
              />
            </div>
          )}
        </main>

        {/* Floating Quick Add Action Button (Thumb reachable for Galaxy S25 FE) */}
        <button
          id="floating-quick-add-btn"
          onClick={() => handleOpenQuickAdd('expense')}
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 sm:right-[max(1rem,calc(50%-235px))] z-40 w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all border-2 border-slate-900"
          aria-label="Registrar transação rápida"
          title="Novo Gasto ou Renda"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Bottom Bar Navigation with Galaxy S25 FE Safe Area padding and One UI ergonomic layout */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 pb-safe">
          <div className="max-w-lg mx-auto px-2 py-1.5 flex items-center justify-around">
            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="text-[10px]">Início</span>
            </button>

            {/* Transactions Tab */}
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
                activeTab === 'transactions'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <PieChart className="w-5 h-5" />
              <span className="text-[10px]">Extrato</span>
            </button>

            {/* Investments Tab */}
            <button
              onClick={() => setActiveTab('investments')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
                activeTab === 'investments'
                  ? 'text-teal-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px]">Investir</span>
            </button>

            {/* Goals Tab */}
            <button
              onClick={() => setActiveTab('goals')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
                activeTab === 'goals'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <Target className="w-5 h-5" />
              <span className="text-[10px]">Metas</span>
            </button>

            {/* Integrated Cards & Bills Tab */}
            <button
              onClick={() => setActiveTab('bills')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all relative ${
                activeTab === 'bills'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-[10px]">Cartões & Faturas</span>
              {stats.pendingBillsCount > 0 && (
                <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          </div>
        </nav>

        {/* Modals & Dialogs */}
        <QuickAddModal
          isOpen={quickAddOpen}
          initialType={quickAddType}
          transactionToEdit={transactionToEdit}
          onUpdateTransaction={handleUpdateTransaction}
          onClose={() => {
            setQuickAddOpen(false);
            setTransactionToEdit(null);
          }}
          onAddTransaction={handleAddTransaction}
          onAddMultipleTransactions={handleAddMultipleTransactions}
          customCategories={categories}
          onOpenCategoriesManager={() => setCategoriesManagerOpen(true)}
          cards={cards}
          onOpenCardsManager={() => setCardsManagerOpen(true)}
        />

        <DailyViewModal
          isOpen={dailyViewOpen}
          onClose={() => setDailyViewOpen(false)}
          transactions={transactions}
          selectedMonth={selectedMonth}
          availableBudget={stats.availableBudget}
          onOpenQuickAdd={handleOpenQuickAdd}
        />

        <React.Suspense fallback={null}>
          <CardsManagerModal
            isOpen={cardsManagerOpen}
            onClose={() => setCardsManagerOpen(false)}
            cards={cards}
            onSaveCard={handleSaveCard}
            onDeleteCard={handleDeleteCard}
            transactions={transactions}
            bills={bills}
            selectedMonth={selectedMonth}
          />

          <SettingsModal
            isOpen={salaryConfigOpen}
            onClose={() => setSalaryConfigOpen(false)}
            profile={profile}
            selectedMonth={selectedMonth}
            onSaveProfile={(updated) => {
              setProfile(updated);
              saveUserProfile(updated);
              showToast('Configurações atualizadas com sucesso!');
            }}
            onOpenCategoriesManager={() => setCategoriesManagerOpen(true)}
            onOpenSecurityModal={() => setSecurityModalOpen(true)}
            cloudUser={cloudUser}
            isCloudSyncing={isCloudSyncing}
            lastSyncTime={lastSyncTime}
            onLoginGoogle={handleLoginGoogle}
            onLogoutCloud={handleLogoutCloud}
            onClearAllData={handleClearAllData}
            onExportPdf={handleExportPdf}
          />

          <MonthlyBalanceModal
            isOpen={monthlyBalanceOpen}
            onClose={() => setMonthlyBalanceOpen(false)}
            selectedMonth={selectedMonth}
            stats={stats}
            bills={bills}
            transactions={transactions}
            profile={profile}
            goals={goals}
            onExportPdf={handleExportPdf}
            onChangeMonth={setSelectedMonth}
            onOpenSalaryConfig={() => {
              setMonthlyBalanceOpen(false);
              setSalaryConfigOpen(true);
            }}
            onOpenBillsManager={() => {
              setMonthlyBalanceOpen(false);
              setActiveTab('bills');
            }}
          />

          <CloudSyncModal
            isOpen={cloudModalOpen}
            onClose={() => setCloudModalOpen(false)}
            cloudUser={cloudUser}
            isSyncing={isCloudSyncing}
            lastSyncTime={lastSyncTime}
            onSaveToCloud={handleSyncToCloud}
            onRestoreFromCloud={handleRestoreFromCloud}
            onLoginGoogle={handleLoginGoogle}
            onLogout={handleLogoutCloud}
            onClearAllData={handleClearAllData}
            onPurgeUnrealData={handlePurgeUnrealData}
          />

          <NotificationsModal
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            bills={bills}
            stats={stats}
            onPayBill={handlePayBill}
          />

          <CategoriesManagerModal
            isOpen={categoriesManagerOpen}
            onClose={() => setCategoriesManagerOpen(false)}
            categories={categories}
            onUpdateCategories={setCategories}
            initialType="expense"
          />

          <InvestmentModal
            isOpen={investmentModalOpen}
            onClose={() => {
              setInvestmentModalOpen(false);
              setAssetToEdit(null);
            }}
            onSaveInvestment={handleSaveInvestment}
            assetToEdit={assetToEdit}
            selectedMonth={selectedMonth}
          />

          <SecurityConfigModal
            isOpen={securityModalOpen}
            onClose={() => setSecurityModalOpen(false)}
            securityConfig={profile.securityConfig}
            onSaveConfig={handleSaveSecurityConfig}
            cards={cards}
            transactions={transactions}
            bills={bills}
            profile={profile}
          />

          {/* Calculadora de Rebalanceamento de Carteira */}
          <InvestmentRebalanceModal
            isOpen={rebalanceModalOpen}
            onClose={() => setRebalanceModalOpen(false)}
            investments={investments}
          />

          {/* Simulador de Independência Financeira (FIRE) */}
          <FireSimulatorModal
            isOpen={fireSimulatorOpen}
            onClose={() => setFireSimulatorOpen(false)}
            currentNetWorth={
              investmentStats.currentTotalValue +
              Math.max(0, stats.totalIncome - stats.totalExpenses)
            }
          />

          {/* Importação e Conciliação Financeira (.OFX) */}
          <OfxImportModal
            isOpen={ofxModalOpen}
            onClose={() => setOfxModalOpen(false)}
            onImportTransactions={(newTxs) => {
              handleAddMultipleTransactions(newTxs);
              setOfxModalOpen(false);
            }}
            existingTransactions={transactions}
            customCategories={categories}
          />
        </React.Suspense>

        {/* Biometric Device Lock Screen Overlay */}
        {isLocked && profile.securityConfig?.enabled && (
          <BiometricLockScreen
            config={profile.securityConfig}
            userName={profile.name || 'Você'}
            onUnlocked={() => setIsLocked(false)}
          />
        )}
      </div>
    </div>
  );
}
