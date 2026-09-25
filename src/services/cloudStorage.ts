import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  increment,
  query,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import {
  Transaction,
  FixedBill,
  SavingsGoal,
  UserFinancialProfile,
  CustomCategory,
  InvestmentAsset,
  PaymentCard,
} from '../types';
import { isUnrealItem } from '../utils/storage';

/**
 * Strips all keys whose values are undefined (recursively),
 * preventing Firestore errors: "Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Service to sync and backup all personal financial records to Firestore in the cloud
 * Exclusively partitioned by authenticated user UID
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let currentUser: User | null = null;
let authInitializedPromise: Promise<User | null> | null = null;

export function initFirebaseAuth(): Promise<User | null> {
  if (authInitializedPromise) return authInitializedPromise;

  authInitializedPromise = new Promise((resolve) => {
    // Check if user is returning from a redirect sign in
    getRedirectResult(auth)
      .then((cred) => {
        if (cred?.user) {
          currentUser = cred.user;
        }
      })
      .catch((err) => {
        console.warn('Redirect result check:', err);
      })
      .finally(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          currentUser = user;
          resolve(user);
        });

        // Timeout safety in case auth state takes long
        setTimeout(() => {
          resolve(auth.currentUser);
        }, 2000);
      });
  });

  return authInitializedPromise;
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    callback(user);
  });
}

export async function loginWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const cred = await signInWithPopup(auth, provider);
    currentUser = cred.user;
    return cred.user;
  } catch (err: unknown) {
    const authErr = err as { code?: string; message?: string };
    console.error('Erro ao autenticar com Google:', authErr);
    if (authErr?.code === 'auth/popup-blocked') {
      console.warn('Popup bloqueado, tentando redirect como alternativa...');
      try {
        await signInWithRedirect(auth, provider);
        return null;
      } catch (redirectErr) {
        console.error('Redirect falhou também:', redirectErr);
        throw new Error(
          'O navegador bloqueou o pop-up de login. Por favor, permita pop-ups ou abra a aplicação diretamente em uma nova aba.'
        );
      }
    }
    throw err;
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
    currentUser = null;
  } catch (err) {
    console.error('Erro ao desconectar:', err);
    throw err;
  }
}

export function getCurrentUser(): User | null {
  return currentUser || auth.currentUser;
}

export function getCurrentUserId(): string | null {
  return currentUser?.uid || auth.currentUser?.uid || null;
}

/**
 * Save user profile to Firestore
 */
export async function syncUserProfileToCloud(profile: UserFinancialProfile): Promise<boolean> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;

  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      sanitizeForFirestore({
        ...profile,
        userId: user.uid,
        updatedAt: Date.now(),
      }),
      { merge: true }
    );

    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('permission') || msg.includes('Permission')) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error('Error syncing profile to cloud:', err);
    return false;
  }
}

/**
 * Load user profile from Firestore
 */
export async function fetchUserProfileFromCloud(): Promise<UserFinancialProfile | null> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return null;

  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserFinancialProfile;
    }
    return null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('permission') || msg.includes('Permission')) {
      handleFirestoreError(err, OperationType.GET, path);
    }
    console.error('Error fetching profile from cloud:', err);
    return null;
  }
}

/**
 * Granular Real-Time Cloud Save and Delete Operations
 * Called automatically on every user action
 */

export async function saveTransactionToCloud(tx: Transaction): Promise<boolean> {
  if (isUnrealItem(tx)) return false;
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;
  try {
    const txRef = doc(db, 'users', user.uid, 'transactions', tx.id);
    const userRef = doc(db, 'users', user.uid);
    const batch = writeBatch(db);
    batch.set(txRef, sanitizeForFirestore({ ...tx, userId: user.uid }), { merge: true });

    // Atomic increment/decrement on user profile balance without re-reading whole collection
    const delta = tx.type === 'income' ? tx.amount : -tx.amount;
    batch.set(
      userRef,
      {
        cachedBalance: increment(delta),
        lastTransactionAt: Date.now(),
      },
      { merge: true }
    );

    await batch.commit();
    return true;
  } catch (e) {
    console.error('Auto-save transaction error:', e);
    return false;
  }
}

export async function deleteTransactionFromCloud(
  txId: string,
  txData?: { amount: number; type: 'expense' | 'income' }
): Promise<boolean> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;
  try {
    const txRef = doc(db, 'users', user.uid, 'transactions', txId);
    const userRef = doc(db, 'users', user.uid);
    const batch = writeBatch(db);
    batch.delete(txRef);

    if (txData) {
      const revertDelta = txData.type === 'income' ? -txData.amount : txData.amount;
      batch.set(
        userRef,
        {
          cachedBalance: increment(revertDelta),
          lastTransactionAt: Date.now(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    return true;
  } catch (e) {
    console.error('Auto-delete transaction error:', e);
    return false;
  }
}

/**
 * Cursor-based pagination for transactions (limit 20 and startAfter lastDoc)
 */
export async function fetchPaginatedTransactionsFromCloud(
  pageSize: number = 20,
  lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null
): Promise<{
  transactions: Transaction[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return { transactions: [], lastDoc: null, hasMore: false };

  try {
    const colRef = collection(db, 'users', user.uid, 'transactions');
    let q = lastVisibleDoc
      ? query(colRef, orderBy('date', 'desc'), startAfter(lastVisibleDoc), limit(pageSize))
      : query(colRef, orderBy('date', 'desc'), limit(pageSize));

    const snap = await getDocs(q);
    const transactions = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Transaction));
    const lastDoc = snap.docs[snap.docs.length - 1] || null;
    const hasMore = snap.docs.length === pageSize;

    return { transactions, lastDoc, hasMore };
  } catch (err) {
    console.error('Error fetching paginated transactions:', err);
    return { transactions: [], lastDoc: null, hasMore: false };
  }
}

export async function saveFixedBillToCloud(bill: FixedBill): Promise<boolean> {
  if (isUnrealItem(bill)) return false;
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;
  try {
    const ref = doc(db, 'users', user.uid, 'fixedBills', bill.id);
    await setDoc(ref, sanitizeForFirestore({ ...bill, userId: user.uid }), { merge: true });
    return true;
  } catch (e) {
    console.error('Auto-save fixed bill error:', e);
    return false;
  }
}

export async function deleteFixedBillFromCloud(billId: string): Promise<boolean> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;
  try {
    const ref = doc(db, 'users', user.uid, 'fixedBills', billId);
    await deleteDoc(ref);
    return true;
  } catch (e) {
    console.error('Auto-delete fixed bill error:', e);
    return false;
  }
}

export async function saveSavingsGoalToCloud(goal: SavingsGoal): Promise<boolean> {
  if (isUnrealItem(goal)) return false;
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;
  try {
    const ref = doc(db, 'users', user.uid, 'savingsGoals', goal.id);
    await setDoc(ref, sanitizeForFirestore({ ...goal, userId: user.uid }), { merge: true });
    return true;
  } catch (e) {
    console.error('Auto-save savings goal error:', e);
    return false;
  }
}

export async function deleteSavingsGoalFromCloud(goalId: string): Promise<boolean> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;
  try {
    const ref = doc(db, 'users', user.uid, 'savingsGoals', goalId);
    await deleteDoc(ref);
    return true;
  } catch (e) {
    console.error('Auto-delete savings goal error:', e);
    return false;
  }
}

export async function saveInvestmentToCloud(asset: InvestmentAsset): Promise<boolean> {
  if (isUnrealItem(asset)) return false;
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;
  try {
    const ref = doc(db, 'users', user.uid, 'investments', asset.id);
    await setDoc(ref, sanitizeForFirestore({ ...asset, userId: user.uid }), { merge: true });
    return true;
  } catch (e) {
    console.error('Auto-save investment error:', e);
    return false;
  }
}

export async function deleteInvestmentFromCloud(assetId: string): Promise<boolean> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;
  try {
    const ref = doc(db, 'users', user.uid, 'investments', assetId);
    await deleteDoc(ref);
    return true;
  } catch (e) {
    console.error('Auto-delete investment error:', e);
    return false;
  }
}

export async function saveCustomCategoryToCloud(cat: CustomCategory): Promise<boolean> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;
  try {
    const ref = doc(db, 'users', user.uid, 'customCategories', cat.id);
    await setDoc(ref, sanitizeForFirestore({ ...cat, userId: user.uid }), { merge: true });
    return true;
  } catch (e) {
    console.error('Auto-save category error:', e);
    return false;
  }
}

export async function deleteCustomCategoryFromCloud(catId: string): Promise<boolean> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;
  try {
    const ref = doc(db, 'users', user.uid, 'customCategories', catId);
    await deleteDoc(ref);
    return true;
  } catch (e) {
    console.error('Auto-delete category error:', e);
    return false;
  }
}

/**
 * Actively scans cloud database and purges all unreal/mock items permanently
 */
export async function purgeUnrealDataFromCloud(): Promise<{ success: boolean; purged: number }> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return { success: false, purged: 0 };

  let purged = 0;
  try {
    const subcollections = ['transactions', 'fixedBills', 'savingsGoals', 'investments'];
    for (const subcol of subcollections) {
      const snap = await getDocs(collection(db, 'users', user.uid, subcol));
      for (const d of snap.docs) {
        const item = { id: d.id, ...d.data() };
        if (isUnrealItem(item)) {
          await deleteDoc(d.ref);
          purged++;
        }
      }
    }

    // Check profile
    const profileRef = doc(db, 'users', user.uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      if (data.fixedSalary === 4800 || data.name === 'Meu Orçamento' || data.name === 'Usuário Exemplo') {
        await setDoc(profileRef, {
          ...data,
          fixedSalary: data.fixedSalary === 4800 ? 0 : data.fixedSalary,
          name: data.name === 'Meu Orçamento' || data.name === 'Usuário Exemplo' ? '' : data.name,
        }, { merge: true });
      }
    }

    return { success: true, purged };
  } catch (e) {
    console.error('Error purging unreal data from cloud:', e);
    return { success: false, purged };
  }
}

/**
 * Wipe all user data in cloud for a pristine clean start
 */
export async function clearAllCloudFinancialData(): Promise<boolean> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return false;

  try {
    const subcollections = ['transactions', 'fixedBills', 'savingsGoals', 'investments', 'customCategories'];
    for (const subcol of subcollections) {
      const snap = await getDocs(collection(db, 'users', user.uid, subcol));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return true;
  } catch (e) {
    console.error('Error clearing cloud data:', e);
    return false;
  }
}

/**
 * Save single payment card to cloud
 */
export async function savePaymentCardToCloud(
  card: PaymentCard
): Promise<{ success: boolean; error?: string }> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return { success: false, error: 'Usuário não conectado ao banco de dados em nuvem.' };

  const path = `users/${user.uid}/paymentCards/${card.id}`;
  try {
    const cardRef = doc(db, 'users', user.uid, 'paymentCards', card.id);
    await setDoc(cardRef, sanitizeForFirestore({ ...card, userId: user.uid }), { merge: true });
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error saving payment card to cloud:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete payment card from cloud
 */
export async function deletePaymentCardFromCloud(
  cardId: string
): Promise<{ success: boolean; error?: string }> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) return { success: false, error: 'Usuário não conectado ao banco de dados em nuvem.' };

  try {
    const cardRef = doc(db, 'users', user.uid, 'paymentCards', cardId);
    await deleteDoc(cardRef);
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * Save entire financial dataset to cloud with full reconciliation (deletes removed records)
 */
export async function backupFullDataToCloud(data: {
  profile: UserFinancialProfile;
  transactions: Transaction[];
  bills: FixedBill[];
  goals: SavingsGoal[];
  categories: CustomCategory[];
  investments: InvestmentAsset[];
  cards?: PaymentCard[];
}): Promise<{ success: boolean; error?: string }> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) {
    return {
      success: false,
      error: 'Faça login com sua conta Google para sincronizar os dados na nuvem com segurança.',
    };
  }

  const basePath = `users/${user.uid}`;
  try {
    // 1. Fetch current document IDs from cloud to reconcile (remove deleted items)
    const [txSnap, billsSnap, goalsSnap, catSnap, invSnap, cardsSnap] = await Promise.all([
      getDocs(collection(db, 'users', user.uid, 'transactions')),
      getDocs(collection(db, 'users', user.uid, 'fixedBills')),
      getDocs(collection(db, 'users', user.uid, 'savingsGoals')),
      getDocs(collection(db, 'users', user.uid, 'customCategories')),
      getDocs(collection(db, 'users', user.uid, 'investments')),
      getDocs(collection(db, 'users', user.uid, 'paymentCards')),
    ]);

    const activeTxIds = new Set(data.transactions.filter((t) => !isUnrealItem(t)).map((t) => t.id));
    const activeBillIds = new Set(data.bills.filter((b) => !isUnrealItem(b)).map((b) => b.id));
    const activeGoalIds = new Set(data.goals.filter((g) => !isUnrealItem(g)).map((g) => g.id));
    const activeCatIds = new Set(data.categories.map((c) => c.id));
    const activeInvIds = new Set(data.investments.filter((i) => !isUnrealItem(i)).map((i) => i.id));
    const activeCardIds = new Set((data.cards || []).map((c) => c.id));

    const batch = writeBatch(db);

    // Profile
    const profileRef = doc(db, 'users', user.uid);
    batch.set(
      profileRef,
      sanitizeForFirestore({
        ...data.profile,
        userId: user.uid,
        updatedAt: Date.now(),
      }),
      { merge: true }
    );

    // Transactions: write active & delete removed or unreal
    for (const tx of data.transactions) {
      if (!isUnrealItem(tx)) {
        const ref = doc(db, 'users', user.uid, 'transactions', tx.id);
        batch.set(ref, sanitizeForFirestore({ ...tx, userId: user.uid }));
      }
    }
    txSnap.docs.forEach((d) => {
      if (!activeTxIds.has(d.id) || isUnrealItem({ id: d.id, ...d.data() })) {
        batch.delete(d.ref);
      }
    });

    // Fixed Bills: write active & delete removed or unreal
    for (const bill of data.bills) {
      if (!isUnrealItem(bill)) {
        const ref = doc(db, 'users', user.uid, 'fixedBills', bill.id);
        batch.set(ref, sanitizeForFirestore({ ...bill, userId: user.uid }));
      }
    }
    billsSnap.docs.forEach((d) => {
      if (!activeBillIds.has(d.id) || isUnrealItem({ id: d.id, ...d.data() })) {
        batch.delete(d.ref);
      }
    });

    // Savings Goals: write active & delete removed or unreal
    for (const goal of data.goals) {
      if (!isUnrealItem(goal)) {
        const ref = doc(db, 'users', user.uid, 'savingsGoals', goal.id);
        batch.set(ref, sanitizeForFirestore({ ...goal, userId: user.uid }));
      }
    }
    goalsSnap.docs.forEach((d) => {
      if (!activeGoalIds.has(d.id) || isUnrealItem({ id: d.id, ...d.data() })) {
        batch.delete(d.ref);
      }
    });

    // Categories: write active & delete removed
    for (const cat of data.categories) {
      const ref = doc(db, 'users', user.uid, 'customCategories', cat.id);
      batch.set(ref, sanitizeForFirestore({ ...cat, userId: user.uid }));
    }
    catSnap.docs.forEach((d) => {
      if (!activeCatIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });

    // Investments: write active & delete removed or unreal
    for (const inv of data.investments) {
      if (!isUnrealItem(inv)) {
        const ref = doc(db, 'users', user.uid, 'investments', inv.id);
        batch.set(ref, sanitizeForFirestore({ ...inv, userId: user.uid }));
      }
    }
    invSnap.docs.forEach((d) => {
      if (!activeInvIds.has(d.id) || isUnrealItem({ id: d.id, ...d.data() })) {
        batch.delete(d.ref);
      }
    });

    // Payment Cards: write active & delete removed
    if (data.cards) {
      for (const card of data.cards) {
        const ref = doc(db, 'users', user.uid, 'paymentCards', card.id);
        batch.set(ref, sanitizeForFirestore({ ...card, userId: user.uid }));
      }
      cardsSnap.docs.forEach((d) => {
        if (!activeCardIds.has(d.id)) {
          batch.delete(d.ref);
        }
      });
    }

    await batch.commit();
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error backing up data to cloud:', error);
    if (error.message.includes('permission') || error.message.includes('Permission')) {
      try {
        handleFirestoreError(err, OperationType.WRITE, basePath);
      } catch (fErr) {
        return { success: false, error: 'Permissão negada no banco em nuvem.' };
      }
    }
    return { success: false, error: error.message || 'Falha ao salvar no banco em nuvem.' };
  }
}

/**
 * Restore/fetch entire financial dataset from cloud, strictly excluding and purging unreal items
 */
export async function fetchFullDataFromCloud(): Promise<{
  success: boolean;
  data?: {
    profile?: UserFinancialProfile;
    transactions: Transaction[];
    bills: FixedBill[];
    goals: SavingsGoal[];
    categories: CustomCategory[];
    investments: InvestmentAsset[];
    cards?: PaymentCard[];
  };
  error?: string;
}> {
  const user = getCurrentUser() || (await initFirebaseAuth());
  if (!user) {
    return { success: false, error: 'Usuário não conectado ao banco de dados em nuvem.' };
  }

  const basePath = `users/${user.uid}`;
  try {
    const [
      profileSnap,
      txSnap,
      billsSnap,
      goalsSnap,
      catSnap,
      invSnap,
      cardsSnap,
    ] = await Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDocs(collection(db, 'users', user.uid, 'transactions')),
      getDocs(collection(db, 'users', user.uid, 'fixedBills')),
      getDocs(collection(db, 'users', user.uid, 'savingsGoals')),
      getDocs(collection(db, 'users', user.uid, 'customCategories')),
      getDocs(collection(db, 'users', user.uid, 'investments')),
      getDocs(collection(db, 'users', user.uid, 'paymentCards')),
    ]);

    const transactions: Transaction[] = [];
    const unrealTxRefs: any[] = [];
    txSnap.forEach((d) => {
      const data = d.data() as Transaction;
      if (!isUnrealItem(data)) {
        transactions.push(data);
      } else {
        unrealTxRefs.push(d.ref);
      }
    });

    const bills: FixedBill[] = [];
    const unrealBillRefs: any[] = [];
    billsSnap.forEach((d) => {
      const data = d.data() as FixedBill;
      if (!isUnrealItem(data)) {
        bills.push(data);
      } else {
        unrealBillRefs.push(d.ref);
      }
    });

    const goals: SavingsGoal[] = [];
    const unrealGoalRefs: any[] = [];
    goalsSnap.forEach((d) => {
      const data = d.data() as SavingsGoal;
      if (!isUnrealItem(data)) {
        goals.push(data);
      } else {
        unrealGoalRefs.push(d.ref);
      }
    });

    const categories: CustomCategory[] = [];
    catSnap.forEach((d) => categories.push(d.data() as CustomCategory));

    const investments: InvestmentAsset[] = [];
    const unrealInvRefs: any[] = [];
    invSnap.forEach((d) => {
      const data = d.data() as InvestmentAsset;
      if (!isUnrealItem(data)) {
        investments.push(data);
      } else {
        unrealInvRefs.push(d.ref);
      }
    });

    const cards: PaymentCard[] = [];
    cardsSnap.forEach((d) => {
      cards.push(d.data() as PaymentCard);
    });

    // Asynchronously delete any lingering unreal items from cloud
    const toDeleteRefs = [...unrealTxRefs, ...unrealBillRefs, ...unrealGoalRefs, ...unrealInvRefs];
    if (toDeleteRefs.length > 0) {
      const cleanupBatch = writeBatch(db);
      toDeleteRefs.forEach((ref) => cleanupBatch.delete(ref));
      cleanupBatch.commit().catch((e) => console.warn('Background cleanup of unreal items failed:', e));
    }

    const rawProfile = profileSnap.exists() ? (profileSnap.data() as UserFinancialProfile) : undefined;
    const profile = rawProfile
      ? {
          ...rawProfile,
          fixedSalary: rawProfile.fixedSalary === 4800 ? 0 : rawProfile.fixedSalary || 0,
          name: rawProfile.name === 'Meu Orçamento' || rawProfile.name === 'Usuário Exemplo' ? '' : rawProfile.name || '',
        }
      : undefined;

    return {
      success: true,
      data: {
        profile,
        transactions,
        bills,
        goals,
        categories,
        investments,
        cards,
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error fetching full data from cloud:', error);
    if (error.message.includes('permission') || error.message.includes('Permission')) {
      try {
        handleFirestoreError(err, OperationType.GET, basePath);
      } catch (fErr) {
        return { success: false, error: 'Permissão negada ao ler banco de dados.' };
      }
    }
    return { success: false, error: error.message || 'Erro ao sincronizar com o banco.' };
  }
}
